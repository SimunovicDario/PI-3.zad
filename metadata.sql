use AdventureWorksDW2019

DROP TABLE IF EXISTS tabAtributAgrFun 
DROP TABLE IF EXISTS dimCinj 
DROP TABLE IF EXISTS tabAtribut 
DROP TABLE IF EXISTS tipAtrib 
DROP TABLE IF EXISTS tablica 
DROP TABLE IF EXISTS tipTablica 
DROP TABLE IF EXISTS agrFun 

CREATE TABLE tipTablica (
    sifTipTablica TINYINT CONSTRAINT pkTipTablica PRIMARY KEY 
  , nazTipTablica CHAR(30) NOT NULL  
)
INSERT INTO tipTablica VALUES (1, 'Činjenična tablica');
INSERT INTO tipTablica VALUES (2, 'Dimenzijska tablica');

CREATE TABLE tablica (
    sifTablica       INTEGER IDENTITY (100, 1) CONSTRAINT pkTablica PRIMARY KEY
  , nazTablica       CHAR(100) NOT NULL
  , nazSQLTablica   CHAR(100) NOT NULL   
  , sifTipTablica    TINYINT   NOT NULL
)

ALTER TABLE tablica ADD CONSTRAINT fkTablicaTipTablica FOREIGN KEY (sifTipTablica) REFERENCES tipTablica (sifTipTablica)



CREATE TABLE tipAtrib (
    sifTipAtrib   TINYINT CONSTRAINT pkTipAtrib PRIMARY KEY
  , nazTipAtrib   CHAR(40) NOT NULL  
)
INSERT INTO tipAtrib VALUES (1, 'Mjera')
INSERT INTO tipAtrib VALUES (2, 'Dimenzijski atribut')
INSERT INTO tipAtrib VALUES (3, 'Strani ključ')

CREATE TABLE agrFun (
  sifAgrFun TINYINT PRIMARY KEY
  , nazAgrFun CHAR(6) NOT NULL  
)
INSERT INTO agrFun VALUES (1, 'SUM')
INSERT INTO agrFun VALUES (2, 'COUNT')
INSERT INTO agrFun VALUES (3, 'AVG')
INSERT INTO agrFun VALUES (4, 'MIN')
INSERT INTO agrFun VALUES (5, 'MAX')


CREATE TABLE tabAtribut (
    sifTablica  INTEGER  CONSTRAINT fkTabAtribTablica REFERENCES tablica(sifTablica)
  , rbrAtrib    TINYINT  NOT NULL  
  , imeSQLAtrib char(50) NOT NULL  
  , sifTipAtrib TINYINT CONSTRAINT fkTabAtribTipAtrib REFERENCES tipAtrib(sifTipAtrib)  
  , imeAtrib    CHAR(50) NOT NULL
 -- , sifAgrFun   TINYINT     
  , CONSTRAINT pkTabAtribut PRIMARY KEY (sifTablica, rbrAtrib)
)
--CREATE UNIQUE INDEX idxTabAtribAtribAgrFun ON tabAtribut(sifTablica, imeSQLAtrib, sifAgrFun)
-- ALTER TABLE tabAtribut ADD CONSTRAINT fkTabAtributAgrFun FOREIGN KEY (sifAgrFun) REFERENCES agrFun (sifAgrFun)

CREATE TABLE dimCinj (
    sifCinjTablica INTEGER
  , sifDimTablica  INTEGER
  , rbrCinj  		 TINYINT  NOT NULL  
  , rbrDim         TINYINT  NOT NULL  
  , CONSTRAINT pkDimCinj PRIMARY KEY (sifCinjTablica, sifDimTablica, rbrCinj, rbrDim) 
  , CONSTRAINT fkDimCinjTablica1 FOREIGN KEY (sifCinjTablica, rbrCinj) REFERENCES tabAtribut(sifTablica, rbrAtrib)
  , CONSTRAINT fkDimCinjTablica2 FOREIGN KEY (sifDimTablica, rbrDim) REFERENCES tabAtribut(sifTablica, rbrAtrib)
)

CREATE TABLE tabAtributAgrFun (
    sifTablica  INTEGER  
  , rbrAtrib    TINYINT  
  , sifAgrFun   TINYINT  CONSTRAINT fkTabAtributAgrFun_AgrFun REFERENCES agrFun (sifAgrFun)
  , imeAtrib    CHAR(50) NOT NULL
  , CONSTRAINT pkTabAtributAgrFun PRIMARY KEY (sifTablica, rbrAtrib, sifAgrFun)
  , CONSTRAINT fkTabAtributAgrFun_TabAtribut foreign key (sifTablica, rbrAtrib) REFERENCES tabAtribut(sifTablica, rbrAtrib)  
)


------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------
--             PUNJENJE STRUKTURE S TESTNIM PODACIMA
------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------

INSERT INTO tablica (nazTablica, nazSQLTablica, sifTipTablica) 
SELECT name, name, 1
  FROM sysobjects
 WHERE xtype = 'u'
   AND name LIKE 'Fact%' -- za AdventureWorks staviti LIKE 'Fact%'


INSERT INTO tablica (nazTablica, nazSQLTablica, sifTipTablica) 
SELECT name, name, 2
  FROM sysobjects
 WHERE xtype = 'u'
   AND name LIKE 'Dim%' -- za AdventureWorks staviti LIKE 'Dim%'
   AND name <> 'dimCinj' 

-- Prepisuje podatke o SVIM atributima u naše tablice
-- Poslije ručno promijeniti neki naziv kako bi se testiralo imeAtrib <> imeSQLAtrib

--dim atr:
INSERT INTO tabAtribut  
SELECT (SELECT sifTablica FROM tablica WHERE nazSQLTablica =  t.name)
     , c.colid
     , c.name
     , 2
     , c.name
     
  FROM sysobjects t, syscolumns c
  WHERE t.id = c.id
    AND t.xtype = 'u'
    AND t.name LIKE 'Dim%' -- za AdventureWorks staviti LIKE 'Dim%'
    AND t.name <> 'dimCinj'
  ORDER BY 1, 2
  
 
-- Prepisuje podatke o SVIM atributuma iz činjenične tablice
-- promijeniti neki naziv kako bi se testiralo imeAtrib <> imeSQLAtrib
 
-- mjere i ostali atributi činjeničnih tablica:
--upiti će ispravno napuniti tabAtribut tablicu ako ste se pri imenovanju atributa držali neke konvencije 
--npr. ključevi dimenzija i strani ključevi činjeničnih tablica sadrže neki uzorak ('%sif%' ili '%ID%' ili '%key%',...)
   
--INSERT INTO tabAtribut
--  
--SELECT (SELECT sifTablica FROM tablica WHERE nazSQLTablica =  t.name)
--     , c.colid
--     , c.name
--     , 1
--     , c.name
--     
--  FROM sysobjects t, syscolumns c
-- WHERE t.id = c.id
--   AND t.xtype = 'u'
--   AND t.name LIKE 'c%'   -- za AdventureWorks staviti LIKE 'Fact%'
--   AND t.name <> 'dimCinj'
--   AND NOT (c.name LIKE 'sif%') -- za AdventureWorks staviti LIKE '%Key'
-- ORDER BY 1, 2

INSERT INTO tabAtribut  

SELECT (SELECT sifTablica FROM tablica WHERE nazSQLTablica =  t.name)
     , c.colid
     , c.name
     , 1	--mjere
     , c.name
     
  FROM sysobjects t, syscolumns c
 WHERE t.id = c.id
   AND t.xtype = 'u'
   AND t.name LIKE 'Fact%'   -- za AdventureWorks staviti LIKE 'Fact%'
   AND t.name <> 'dimCinj'
   AND c.name NOT LIKE '%Key' -- za AdventureWorks staviti NOT LIKE '%Key'

UNION 

SELECT (SELECT sifTablica FROM tablica WHERE nazSQLTablica =  t.name)
     , c.colid
     , c.name
     , 3 --strani ključevi prema dimenzijskim tablicama
     , c.name
     
  FROM sysobjects t, syscolumns c
 WHERE t.id = c.id
   AND t.xtype = 'u'
   AND t.name LIKE 'Fact%'   -- za AdventureWorks staviti LIKE 'Fact%'
   AND t.name <> 'dimCinj'
   AND c.name LIKE '%Key' -- za AdventureWorks staviti LIKE '%Key'

 ORDER BY 1, 2

  

-- Na temelju definiranih stranih ključeva prepisuje podatke u naše tablice:

INSERT INTO dimCinj  
  SELECT (SELECT sifTablica FROM tablica WHERE nazSQLTablica =  t1.name)
       , (SELECT sifTablica FROM tablica WHERE nazSQLTablica =  t2.name)
      , (SELECT rbrAtrib FROM tabAtribut, tablica
          WHERE tabAtribut.sifTablica = tablica.sifTablica
            AND tablica.nazSQLTablica = t1.name
            and upper(tabAtribut.imeSQLAtrib) = UPPER(c1.name))
      , (SELECT rbrAtrib FROM tabAtribut, tablica
          WHERE tabAtribut.sifTablica = tablica.sifTablica
            AND tablica.nazSQLTablica = t2.name
            and upper(tabAtribut.imeSQLAtrib) = UPPER(c2.name))
      
  FROM sys.sysforeignkeys fk, sysobjects t1, sysobjects t2, syscolumns c1, syscolumns c2

 WHERE fk.fkeyid = t1.id
   AND fk.rkeyid = t2.id
   AND fk.fkey   = c1.colid
   AND t1.id = c1.id
   AND fk.rkey   = c2.colid
   AND t2.id = c2.id
   AND t1.name LIKE 'Fact%' -- za AdventureWorks staviti LIKE 'Fact%'

 ORDER BY 1, 2
 
 
-- Za svaki mjeru definiram SUM i AVG:
-- Neke kombinacije mogu biti besmislene (npr. sum neaditivne mjere), može se poslije ručno obrisati.
  
INSERT INTO tabAtributAgrFun 

SELECT sifTablica
     , rbrAtrib
     , 1 -- sum
     , 'Sum of ' + imeAtrib     
  FROM tabAtribut
 WHERE sifTipAtrib = 1
 ORDER BY 1, 2
 
 
INSERT INTO tabAtributAgrFun
  
SELECT sifTablica
     , rbrAtrib
     , 3 -- avg
     , 'Avg of ' + imeAtrib     
  FROM tabAtribut
 WHERE sifTipAtrib = 1
 ORDER BY 1, 2
  

--------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------
--
--              Upiti za aplikaciju (punjenje izbornika činjeničnih tablica i stable dim. i mjera)
-- 
--------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------


 
-- vraća činjenične tablice 
SELECT * 
  FROM tablica 
 WHERE sifTipTablica = 1 
  
-- vraća mjere:  
SELECT * 
  FROM tabAtribut, agrFun, tablica, tabAtributAgrFun                                          
 WHERE tabAtribut.sifTablica =  100 -- Zamijeniti s npr. <<this.RadioButtonListFacts.SelectedItem.Value>>
   AND tabAtribut.sifTablica = tablica.sifTablica 
   AND tabAtribut.sifTablica  = tabAtributAgrFun.sifTablica 
   AND tabAtribut.rbrAtrib  = tabAtributAgrFun.rbrAtrib 
   AND tabAtributAgrFun.sifAgrFun = agrFun.sifAgrFun 
   AND tabAtribut.sifTipAtrib = 1
 ORDER BY tabAtribut.rbrAtrib
 
 
 -- vraća dimenzije:
 

SELECT   dimTablica.nazTablica
       , dimTablica.nazSQLTablica  AS nazSqlDimTablica
       , cinjTablica.nazSQLTablica AS nazSqlCinjTablica
       , cinjTabAtribut.imeSQLAtrib
       , dimTabAtribut.imeSqlAtrib
       , tabAtribut.*
  FROM tabAtribut, dimCinj
     , tablica dimTablica, tablica cinjTablica 
     , tabAtribut cinjTabAtribut, tabAtribut dimTabAtribut
 WHERE dimCinj.sifDimTablica  = dimTablica.sifTablica
   AND dimCinj.sifCinjTablica = cinjTablica.sifTablica
   
   AND dimCinj.sifCinjTablica = cinjTabAtribut.sifTablica
   AND dimCinj.rbrCinj = cinjTabAtribut.rbrAtrib
   
   AND dimCinj.sifDimTablica = dimTabAtribut.sifTablica
   AND dimCinj.rbrDim = dimTabAtribut.rbrAtrib

   AND tabAtribut.sifTablica  = dimCinj.sifDimTablica
   AND sifCinjTablica = 100 --  Zamijeniti 
   AND tabAtribut.sifTipAtrib = 2
 ORDER BY dimTablica.nazTablica, rbrAtrib
 
 
