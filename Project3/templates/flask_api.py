# Import the dependencies.
from flask import Flask, jsonify
import sqlalchemy
import os
import datetime as dt
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func
import numpy as np
from flask_cors import CORS

#################################################
# Database Setup
#################################################
os.chdir(os.path.dirname(os.path.realpath(__file__)))
engine = create_engine("sqlite:///final_lightpollution.sqlite")

# reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(engine, reflect=True)

# Save reference to the table
Lightpoldb = Base.classes

#################################################
# Flask Setup
#################################################
app = Flask(__name__)
CORS(app)

#################################################
# Flask Routes
#################################################

@app.route("/")
def welcome():
    """List all available api routes."""
    return (
        f"Available Routes:<br/>"
        f"/api/v1.0/allstates<br/>"
        #f"/api/v1.0/bystate?state=state"
        f"/api/v1.0/bystate/state"
    )


@app.route("/api/v1.0/allstates")
def allstates():
    # Create our session (link) from Python to the DB
    session = Session(engine)

    """Return a list of all passenger names"""
    # Query all states
    results = session.query(Lightpoldb.Latitude,Lightpoldb.Longitude, 
                            Lightpoldb.NELM, Lightpoldb.Constellation, 
                            Lightpoldb.State, Lightpoldb.Bortle_Class).all()

    session.close()

    # Convert list of tuples into normal list
    all_states = list(np.ravel(results))

    return jsonify(all_states)


@app.route(f"/api/v1.0/bystate/<state>")
def bystate(state):
    print('state')
    print(state)
    print('state')
    # Create our session (link) from Python to the DB
    session = Session(engine)

    """Return a list of passenger data including the name, age, and sex of each passenger"""
    # Query all passengers
    results = session.query(Lightpoldb.Latitude,Lightpoldb.Longitude,
                            Lightpoldb.NELM, Lightpoldb.Constellation,
                            Lightpoldb.State, Lightpoldb.Bortle_Class).filter(Lightpoldb.State == state).all()

    session.close()

    # Create a dictionary from the row data and append to a list of all_passengers
    filtered_db = []
    for latitude, longitude, nelm, constellation, state in results:
        lightpol_dict = {}
        lightpol_dict["Latitude"] = latitude
        lightpol_dict["Longitude"] = longitude
        lightpol_dict["NELM"] = nelm
        lightpol_dict["Constellation"] = constellation
        lightpol_dict["State"] = state
        filtered_db.append(lightpol_dict)

    return jsonify(filtered_db)


if __name__ == '__main__':
    app.run(debug=True)
