-- Exported from QuickDBD: https://www.quickdatabasediagrams.com/
-- NOTE! If you have used non-SQL datatypes in your design, you will have to change these here.
DROP TABLE if exists "Moon_Phases";
DROP TABLE if exists "Light_Pollution";
DROP TABLE if exists "Bortle";

CREATE TABLE "Light_Pollution" (
    "ObsDateTime" VARCHAR(255)   NOT NULL,
    "Latitude" Float   NOT NULL,
    "Longitude" Float   NOT NULL,
    "Elevation" Float   NOT NULL,
    "NELM" INT   NOT NULL,
    "Constellation" VARCHAR(255)   NOT NULL,
    "State" VARCHAR(255)   NOT NULL
);

CREATE TABLE "Bortle" (
    "Title" VARCHAR(255)   NOT NULL,
    "Min. NELM" Float   NOT NULL,
    "Max. NELM" Float   NOT NULL
);

CREATE TABLE "Moon_Phases" (
    "Jan." Float,
    "Feb." Float,
    "Mar." Float,
    "Apr." Float,
    "May" Float,
    "June" Float,
    "July" Float,
    "Aug." Float,
    "Sep." Float,
    "Oct." Float,
    "Nov." Float,
    "Dec." Float
);

