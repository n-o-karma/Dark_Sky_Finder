from flask import Flask, jsonify, render_template, request, session
from flask_cors import CORS
import requests
import datetime as dt
import pandas as pd
import json
# pip install -U flask-cors
from api_keys import geoapify_key

#imports for lightpol flask:
import sqlalchemy
import os
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func
import numpy as np

#################################################
# Light Pollution Database Setup
#################################################
os.chdir(os.path.dirname(os.path.realpath(__file__)))
engine = create_engine("sqlite:///templates/final_lightpollution.sqlite")

# reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(engine, reflect=True)

# Save reference to the table
Lpdb = Base.classes.lightpollution

app = Flask(__name__)
CORS(app)

current_date = dt.datetime.now().strftime("%Y-%m-%d")

def moon_data(lat, lon):
    # moon_phases = requests.get(moon_URL).json()
    # # Filter the data for the year 2023
    # filtered_data = [phase for phase in moon_phases['phasedata'] if phase['year'] == 2023]
    # return filtered_data
    latitude = lat
    longitude = lon
    time_str = "00:00"
    moon_data_list = []
    for i in range(11):
        current_date = (dt.date.today() + dt.timedelta(days=i)).strftime("%Y-%m-%d")

        celestial_URL = f"https://aa.usno.navy.mil/api/celnav?date={current_date}&tz=-9&time={time_str}&coords={latitude},{longitude}"
        celestial_data = requests.get(celestial_URL).json()
        moon_illum = celestial_data['properties']['moon_illum']
        moon_phase = celestial_data['properties']['moon_phase']
        moon_data_list.append({
        'date': current_date,
        'moon_illumination': moon_illum,
        'moon_phase': moon_phase
        })   
    # moon_data_df = pd.DataFrame(moon_data_list)
    # moon_data_df['date'] = pd.to_datetime(moon_data_df['date'], format='%Y-%m-%d')
    print(moon_illum)
    return moon_data_list

#  Defind function to get weather data : Cloud forecast for 10 days from today
# Available levels: low, medium, high, effective, total , Available measures: mean
# Available intervals: 1h, 2h, 6h, 12h, 24h  , Available units: octas, p
def weather_data(lat, lon):
    base_url = 'https://api.meteomatics.com'

    current_date = dt.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
    validdatetime = f"{current_date}P10D:PT12H"
    
    latitude = lat
    longitude = lon

    location = f"{latitude},{longitude}"
    format='json'
    #format = 'html'
    optionals = 'source=mix'

    # input our own id and pwd for https://api.meteomatics.com
    #username = 'YOUR ID'
    #password = 'YOUR PASSWORD'

    username= 'upenn_okarma_nicholas'
    password= 'g39T1JCoqe'


    level = "total"
    parameters = f'{level}_cloud_cover_mean_12h:p'

    cloud_url = f'{base_url}/{validdatetime}/{parameters}/{location}/{format}?{optionals}'
    response = requests.get(cloud_url, auth=(username, password))
    weather_data_list = response.json()
    # all_cloud_data[level] = cloud_data
    return  weather_data_list 

def combined_data(moon_data_json,weather_data_json):
    # Change json to dataframes
    moon_data_df = pd.DataFrame(moon_data_json)
    data_list = weather_data_json['data'][0]['coordinates'][0]['dates']
    weather_data_df = pd.DataFrame(data_list)

    # Change date form and filter weather date having only one data per day to match the moon data
    moon_data_df['date'] = pd.to_datetime(moon_data_df['date'], format='%Y-%m-%d')
    weather_data_df['date'] = pd.to_datetime(weather_data_df['date'])
    filtered_weather_data_df = weather_data_df[(weather_data_df['date'].dt.strftime('%H:%M') >= '20:00') & 
                                              (weather_data_df['date'].dt.strftime('%H:%M') <= '23:59') |
                                              (weather_data_df['date'].dt.strftime('%H:%M') >= '00:00') & 
                                              (weather_data_df['date'].dt.strftime('%H:%M') <= '08:00')]
    filtered_weather_data_df.loc[:, 'date'] = pd.to_datetime(filtered_weather_data_df['date'].dt.strftime('%Y-%m-%d'))
    # change the name of colums
    final_weather_df = filtered_weather_data_df.rename(columns={'value': 'cloud_cover'})
    # merge moon data and weather data and match datetime
    moon_weather_df = pd.merge(moon_data_df,final_weather_df, on='date')
    moon_weather_df['date'] = moon_weather_df['date'].dt.strftime('%Y-%m-%d').astype('object')
    # convert into json
    moon_weather_json = moon_weather_df.to_json(orient='records')
    return moon_weather_json

#Define function to get staying places
def get_stay_places(lat, lon):
    radius = 10000 
    params_camping = {
        "categories": "camping",
        "apiKey": geoapify_key,
        "format": "json"
    }
    params_accommodation = {
        "categories": "accommodation.hotel",
        "apiKey": geoapify_key,
        "format": "json"
    }
    latitude = lat
    longitude = lon
    stay_places_data = []

    # Add filter and bias parameters with the current city's latitude and longitude to the params dictionary
    params_camping["filter"] = f"circle:{longitude},{latitude},{radius}"
    params_camping["bias"] = f"proximity:{longitude},{latitude}"

    params_accommodation["filter"] = f"circle:{longitude},{latitude},{radius}"
    params_accommodation["bias"] = f"proximity:{longitude},{latitude}"

    # Set base URL
    base_url = "https://api.geoapify.com/v2/places"

    # Make an API request for camping sites
    response_camping = requests.get(base_url, params=params_camping)
    camping_data = response_camping.json()

    # Make an API request for accommodation
    response_accommodation = requests.get(base_url, params=params_accommodation)
    accommodation_data = response_accommodation.json()

    # Iterate through all the hotels and append their names to the list
    for feature in camping_data["features"]:
        try:
            stay_places_data.append({
                 "name": feature["properties"]["name"],
                "latitude": feature["properties"]["lat"],
                "longitude": feature["properties"]["lon"]
            })
        except KeyError:
            pass

    # Iterate through all the accommodation data and append their names to the list
    for feature in accommodation_data["features"]:
        try:
            stay_places_data.append({
                "name": feature["properties"]["name"],
                "latitude": feature["properties"]["lat"],
                "longitude": feature["properties"]["lon"]
            })
        except KeyError:
            pass

    return stay_places_data, radius

@app.route('/')
def home():
    return render_template('index.html')

@app.route("/api/v1.0/moon-weather-data/<lat>/<lon>", methods=['POST'])
def moon_data_request(lat,lon):
    moon_data_json = moon_data(lat, lon)
    print('moon_data_json')
    print(moon_data_json)
    weather_data_json = weather_data(lat, lon)
    print('weather_data_json')
    print(weather_data_json)
    moon_weather_data_json = combined_data(moon_data_json,weather_data_json)
    print('moon_weather_data_json')
    print(moon_weather_data_json)
    return jsonify(moon_weather_data_json)

@app.route('/api/v1.0/stay-places/<lat>/<lon>', methods=['POST'])
def stay_at_darkplace(lat,lon):
    print(lat)
    stay_places_data, radius = get_stay_places(lat, lon)
    print('stay_places_data')
    print(stay_places_data)
    return jsonify({
        'stay_places_data': stay_places_data,
        'radius': radius
    })

### Routes for lightpol db:
@app.route("/api/v1.0/allstates")
def allstates():
    # Create our session (link) from Python to the DB
    session = Session(engine)

    """Return a list of all passenger names"""
    # Query all states
    results = session.query(Lpdb.Latitude, Lpdb.Longitude, 
                            Lpdb.NELM, Lpdb.Constellation, 
                            Lpdb.State, Lpdb.Bortle_Class).all()

    session.close()

    # Convert list of tuples into normal list
    states_db = []
    for latitude, longitude, nelm, constellation, state, bortleclass in results:
        lightpol_dict = {}
        lightpol_dict["State"] = state
        lightpol_dict["Latitude"] = latitude
        lightpol_dict["Longitude"] = longitude
        lightpol_dict["NELM"] = nelm
        lightpol_dict["Constellation"] = constellation
        lightpol_dict["Bortle_class"] = bortleclass
        states_db.append(lightpol_dict)

    return jsonify(states_db)


@app.route(f"/api/v1.0/bystate/<state>")
def bystate(state):
    print('state')
    print(state)
    print('state')
    # Create our session (link) from Python to the DB
    session = Session(engine)

    """Return a list of passenger data including the name, age, and sex of each passenger"""
    # Query all passengers
    results = session.query(Lpdb.Latitude, Lpdb.Longitude,
                            Lpdb.NELM, Lpdb.Constellation,
                            Lpdb.State, Lpdb.Bortle_Class).filter(Lpdb.State == state).all()

    session.close()

    # Create a dictionary from the row data and append to a list
    filtered_db = []
    for latitude, longitude, nelm, constellation, state, bortleclass in results:
        lightpol_dict = {}
        lightpol_dict["State"] = state
        lightpol_dict["Latitude"] = latitude
        lightpol_dict["Longitude"] = longitude
        lightpol_dict["NELM"] = nelm
        lightpol_dict["Constellation"] = constellation
        lightpol_dict["Bortle_class"] = bortleclass
        filtered_db.append(lightpol_dict)

    return jsonify(filtered_db)

if __name__ == '__main__':
    app.run(debug=True)