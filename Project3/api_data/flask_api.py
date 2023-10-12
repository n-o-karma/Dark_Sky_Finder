import numpy as np

import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func

from flask import Flask, jsonify


url = '' #this is the url to the database of joined jsons we end up creating
engine = create_engine(url)

Base = automap_base()

Base.prepare(autoload_with=engine)

app = Flask(__name__)

@app.route("/")
def welcome():
    return (
        "Available Routes:<br/>"
        "/api/v1.0/ROUTE1<br/>"
        "/api/v1.0/ROUTE2<br/>"
    )


@app.route("/api/v1.0/ROUTE1")
def funct():
    session = Session(engine)

    session.close()

    return jsonify('')


@app.route("/api/v1.0/ROUTE2")
def funct2():
    session = Session(engine)
    
    session.close()

    return jsonify('')


if __name__ == '__main__':
    app.run(debug=True)
