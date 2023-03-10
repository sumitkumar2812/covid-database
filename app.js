const express = require("express");

const path = require("path");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObject1 = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT 
    *
    FROM 
     state
    ORDER BY
      state_id;`;

  const stateArray = await db.all(getStatesQuery);
  response.send(
    stateArray.map((eachState) => convertDbObjectToResponseObject1(eachState))
  );
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictQuary = `
    INSERT INTO
    district ( district_name, state_id, cases, cured, active, deaths )
    VALUES 
    (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  const dbResponse = await db.run(addDistrictQuary);
  const districtId = dbResponse.lastID;
  response.send("District Successfully Added");
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
      state_id AS stateId,
      state_name AS stateName,
      population AS population
    FROM
      state
    WHERE
      state_id = ${stateId};`;

  const stateArray = await db.get(getStateQuery);
  response.send(stateArray);
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
     district_id AS districtId,
  district_name AS districtName,
  state_id AS stateId,
  cases,
  cured,
  active,
  deaths
    FROM
      district
    WHERE
      district_id = ${districtId};`;

  const districtArray = await db.get(getDistrictQuery);
  response.send(districtArray);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM
      district
    WHERE
      district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE
      district
    SET
      district_name='${districtName}',
      state_id=${stateId},
      cases=${cases},
      cured=${cured},
      active=${active},
      deaths=${deaths}
    WHERE
      district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
     SUM(cases),
     SUM(cured),
     SUM(active),
     SUM(deaths)
    FROM
      district
    WHERE
      state_id = ${stateId};`;

  const stateArray = await db.get(getStateQuery);

  console.log(stateArray);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
SELECT
 state_id from district
WHERE
 district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
SELECT 
state_name as stateName
 FROM 
 state
WHERE
 state_id = ${getDistrictIdQueryResponse.state_id};`;

  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});
module.exports = app;
