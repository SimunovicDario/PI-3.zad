import express from 'express';
const app = express()
const port = 3000
import cors from 'cors';
app.use(cors());
import bodyParser from 'body-parser'
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
import sql from "msnodesqlv8";
let server = ".";
let db = "AdventureWorksDW2019";
let isTrusted = "Trusted_Connection=Yes;";
let driver = "{SQL Server Native Client 11.0}";
let connectionString = `Server=${server};Database=${db};Uid=dario;Pwd=test;${isTrusted}Driver=${driver};`;

import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, 'dist')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
})

app.get('/factTables', async (req, res) => {
    await sql.query(connectionString,
        "SELECT * FROM tablica WHERE sifTipTablica = 1",
        (error, factTables) => {
            if (error) {
                const msg = err.message.split("]")
                return res.status(400).send(msg[msg.length - 1])
            }
            factTables.forEach(row => {
                for (let key of Object.keys(row)) {
                    if (typeof row[key] == 'string')
                        row[key] = row[key].trim();
                }
            })
            res.send(factTables)
        });
})

const getMeasures = async (sifTablica) => {
    return new Promise((resolve, reject) => {
        sql.query(connectionString,
            `SELECT *
            FROM tabAtribut, agrFun, tablica, tabAtributAgrFun
            WHERE tabAtribut.sifTablica = ${sifTablica} -- Zamijeniti
            AND tabAtribut.sifTablica = tablica.sifTablica
            AND tabAtribut.sifTablica = tabAtributAgrFun.sifTablica
            AND tabAtribut.rbrAtrib = tabAtributAgrFun.rbrAtrib
            AND tabAtributAgrFun.sifAgrFun = agrFun.sifAgrFun
            AND tabAtribut.sifTablica = tablica.sifTablica
            AND sifTipAtrib = 1
            ORDER BY tabAtribut.rbrAtrib`,
            (error, measures) => {
                if (error)
                    return reject(error)
                measures.forEach(row => {
                    for (let key of Object.keys(row)) {
                        if (typeof row[key] == 'string')
                            row[key] = row[key].trim();
                    }
                })
                return resolve(measures)
            });

    })
}

const getDimensions = async (sifTablica) => {
    return new Promise((resolve, reject) => {
        sql.query(connectionString,
            `SELECT dimTablica.nazTablica
            , dimTablica.nazSQLTablica AS nazSqlDimTablica
            , cinjTablica.nazSQLTablica AS nazSqlCinjTablica
            , cinjTabAtribut.imeSqlAtrib AS cinjTabKljuc
            , dimTabAtribut.imeSqlAtrib AS dimTabKljuc
            , tabAtribut.*
            FROM tabAtribut, dimCinj
            , tablica dimTablica, tablica cinjTablica
            , tabAtribut cinjTabAtribut, tabAtribut dimTabAtribut
            WHERE dimCinj.sifDimTablica = dimTablica.sifTablica
            AND dimCinj.sifCinjTablica = cinjTablica.sifTablica
            AND dimCinj.sifCinjTablica = cinjTabAtribut.sifTablica
            AND dimCinj.rbrCinj = cinjTabAtribut.rbrAtrib
            AND dimCinj.sifDimTablica = dimTabAtribut.sifTablica
            AND dimCinj.rbrDim = dimTabAtribut.rbrAtrib
            AND tabAtribut.sifTablica = dimCinj.sifDimTablica
            AND sifCinjTablica = ${sifTablica} -- Zamijeniti
            AND tabAtribut.sifTipAtrib = 2
            ORDER BY dimTablica.nazTablica, cinjTabAtribut.rbrAtrib
      `,
            (error, dimensions) => {
                if (error)
                    return reject(error)
                let orderedDim = {}
                dimensions.forEach(dim => {
                    for (let key of Object.keys(dim)) {
                        if (typeof dim[key] == 'string')
                            dim[key] = dim[key].trim();
                    }
                    if (!orderedDim[dim.nazTablica]) {
                        orderedDim[dim.nazTablica] = [dim]
                    } else {
                        orderedDim[dim.nazTablica].push(dim)
                    }
                })

                return resolve(dimensions.length > 0 ? orderedDim : null)
            });

    })
}

app.get('/tree/:sifTablica', async (req, res) => {
    const sifTablica = req.params.sifTablica
    try {
        const measures = await getMeasures(sifTablica);
        const dimensions = await getDimensions(sifTablica);
        let response = {};
        if (measures) {
            response.measures = measures;
        }
        if (dimensions) {
            response.dimensions = dimensions;
        }
        res.send(response);
    } catch (err) {
        const msg = err.message.split("]")
        res.status(400).send(msg[msg.length - 1])
    }
})

const executeSQL = async (sqlCode) => {
    return new Promise((resolve, reject) => {
        sql.query(connectionString, sqlCode,
            (error, res) => {
                if (error)
                    return reject(error)
                return resolve(res)
            });

    })
}

app.post('/sql', async (req, res) => {
    try {
        const response = await executeSQL(req.body.sql)
        res.send(response);
    } catch (err) {
        const msg = err.message.split("]")
        res.status(400).send(msg[msg.length - 1])
    }
})

const tryConnect = async () => {
    return new Promise((resolve, reject) => {
        sql.open(connectionString,
            (error, res) => {
                if (error)
                    return reject(error)
                return resolve(res)
            });
    })
}

app.post('/login', async (req, res) => {
    try {
        const { type, server, database, username, password } = req.body;
        connectionString = "";
        connectionString += "Server=" + server;
        connectionString += ";Database=" + database;
        if (type == "Windows")
            connectionString += ";Trusted_Connection=Yes";
        else
            connectionString += ";Uid=" + username + ";Pwd=" + password;
        connectionString += ";Driver={SQL Server Native Client 11.0}";
        console.log(connectionString)
        await tryConnect();
        res.send(null);
    } catch (err) {
        console.log(err[1].message)
        const msg = err[1].message ? err[1].message.split("]") : err.message.split("]");
        res.status(400).send(msg[msg.length - 1])
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})