import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Columns, Config, DefaultConfig } from 'ngx-easy-table';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {
  loggedIn = false;
  factTables: any;
  actFactTable: any;
  tree: any;
  expanded: any = { sidemenu: false, factTables: false, measures: false, dimensions: false };
  checked: any = { measures: {}, dimensions: {} }
  sqlHTML: any = "";
  sql = ``
  configuration: Config;
  columns: Columns[];
  columnsStorage: Columns[];
  tableHeads = [];
  data: any = null;
  error: any;
  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    // this.configuration = { ...DefaultConfig };
    // // this.configuration.searchEnabled = true;
    // this.http.get(environment.url + '/factTables').subscribe((factTables: any) => {
    //   this.factTables = factTables;
    //   // console.log(factTables);
    //   this.setFactTable(factTables[0])
    //   this.getTree(factTables[0].sifTablica);
    // })
  }

  getTree(sifTable: number) {
    this.http.get(environment.url + '/tree/' + sifTable).subscribe((tree: any) => {
      this.tree = tree
      this.expanded = { sidemenu: true, factTables: true, measures: true, dimensions: true }
      if (tree.dimensions)
        for (let key of Object.keys(tree.dimensions)) {
          this.expanded[key] = false;
        }
      this.checked.measures = {}
      this.checked.dimensions = {}
      // console.log(tree)
    })
  }

  setFactTable(row: any) {
    // console.log(row)
    this.actFactTable = row;
    this.getTree(row.sifTablica)
  }

  setMeasure(row: any) {
    const isChecked = this.checked.measures[row.Column14];
    if (isChecked)
      delete this.checked.measures[row.Column14];
    else
      this.checked.measures[row.Column14] = row
    // console.log(this.checked)
    this.generateSql()
  }

  setDimension(key: string, row: any) {
    if (!this.checked.dimensions[key]) {
      this.checked.dimensions[key] = {}
    }

    const isChecked = this.checked.dimensions[key][row.imeAtrib];
    if (isChecked) {
      delete this.checked.dimensions[key][row.imeAtrib];
      if (Object.keys(this.checked.dimensions[key]).length === 0) {
        delete this.checked.dimensions[key]
      }
    } else
      this.checked.dimensions[key][row.imeAtrib] = row
    this.generateSql()
  }

  generateSql() {
    let select = "";
    let from = "<br/> FROM " + this.actFactTable.nazSQLTablica;
    let where = "";
    let whereSet = new Set();
    let groupBySet = new Set();
    let groupBy = "";
    this.columnsStorage = [];
    for (let key of Object.keys(this.checked.dimensions)) {
      let value = this.checked.dimensions[key];
      const firstDim: any = Object.values(value)[0];
      from += "<br/>&emsp;&emsp;&ensp;, " + firstDim.nazSqlDimTablica
      for (let val of Object.values(value)) {
        let row: any = val;
        !select ? select += "SELECT " : select += "<br/>&emsp;&emsp;&emsp;&ensp;, "
        select += row.nazSqlDimTablica + "." + row.imeSQLAtrib + " AS '" + row.imeAtrib + "'"
        this.columnsStorage.push({ key: row.imeAtrib, title: row.imeAtrib })
        console.log(row)
        whereSet.add(row.nazSqlCinjTablica + '.' + row.cinjTabKljuc + ' = ' + row.nazSqlDimTablica + '.' + row.dimTabKljuc)
        // groupBySet.add(row.nazSqlDimTablica + "." + row.dimTabKljuc)
        !groupBy ? groupBy += "<br/> GROUP BY " : groupBy += "<br/>&emsp;&emsp;&emsp;&emsp;&ensp;, "
        groupBy += row.nazSqlDimTablica + "." + row.imeSQLAtrib;
      }
    }
    whereSet.forEach(row => {
      !where ? where += "<br/> WHERE " : where += "<br/>&emsp; AND "
      where += row;
    })
    groupBySet.forEach(row => {
    })
    for (let val of Object.values(this.checked.measures)) {
      let row: any = val;
      !select ? select += "SELECT " : select += "<br/>&emsp;&emsp;&emsp;&ensp;, "
      select += row.nazAgrFun + "(" + row.nazSQLTablica + "." + row.imeSQLAtrib + ") AS '" + row.Column14 + "'"
      this.columnsStorage.push({ key: row.Column14, title: row.Column14 })
    }
    if (select.length > 0 && from.length > 0) {
      this.sqlHTML = select + from + where + groupBy;
      this.sql = this.sqlHTML.replaceAll("<br/>", "").replaceAll("&emsp;", "").replaceAll("&ensp;", "")
    } else {
      this.sqlHTML = "";
      this.sql = ""
    }
    // console.log(this.columns)
  }

  executeSQL() {
    this.error = null;
    this.http.post(environment.url + '/sql', { sql: this.sql }).subscribe((res: any) => {
      this.data = res;
      this.columns = [...this.columnsStorage];
    }, err => {
      // console.log(err)
      this.error = err.error
    })
  }

  login() {
    this.loggedIn = true;
    this.configuration = { ...DefaultConfig };
    // this.configuration.searchEnabled = true;
    this.http.get(environment.url + '/factTables').subscribe((factTables: any) => {
      this.factTables = factTables;
      // console.log(factTables);
      this.setFactTable(factTables[0])
      // this.getTree(factTables[0].sifTablica);
    })
  }

  logout() {
    this.loggedIn = false;
    this.data = null;
    this.sqlHTML = null;
    this.expanded = { sidemenu: false, factTables: false, measures: false, dimensions: false };
    this.checked = { measures: {}, dimensions: {} }
    this.error = null;
  }

}
