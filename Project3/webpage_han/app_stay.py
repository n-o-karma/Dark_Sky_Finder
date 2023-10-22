from flask import Flask, render_template, request, redirect, url_for, jsonify
import requests
import datetime as dt
import pandas as pd
import json
import pytz
import jinja2
from US_states_data import states

# Import the API key
from config import geoapify_key


app = Flask(__name__)
current_date = dt.datetime.now().strftime("%Y-%m-%d")

# Define function to find location of one place in the selected state
# Define function to find location of one place in the selected state
def get_coordinates(selected_state):
    #target_location = f"center of {selected_state}"
    target_url = f"https://api.geoapify.com/v1/geocode/search?text={selected_state}&format=json&apiKey={geoapify_key}"

    # Run a request to the endpoint and convert the result to JSON
    geo_data = requests.get(target_url).json()

    # Extract location only in the selected state
    locations_state = [{'state':location['state'], 'code':location['state_code'],'lat' : location['lat'],'lon': location['lon']} for location in geo_data['results'] if location.get('state') == selected_state]
    
    # Extract latitude and longitude
    if locations_state:
        selected_location = locations_state[0]
        return selected_location
    else:
        return None

#Defind function to get moon data
# moon data : phase of moon
# moon_URL = f'https://aa.usno.navy.mil/api/moon/phases/date?date={current_date}&nump=50'
def moon_data(selected_location):
    # moon_phases = requests.get(moon_URL).json()
    # # Filter the data for the year 2023
    # filtered_data = [phase for phase in moon_phases['phasedata'] if phase['year'] == 2023]
    # return filtered_data
    latitude = selected_location['lat']
    longitude = selected_location['lon']
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
        'moon illumination': moon_illum,
        'moon phase': moon_phase
        })
    moon_data_df = pd.DataFrame(moon_data_list)
    moon_data_df['date'] = pd.to_datetime(moon_data_df['date'], format='%Y-%m-%d')
    return moon_data_df

# Defind function to get weather data
# Cloud forecast for 10 days from today
# Available levels: low, medium, high, effective, total
# Available measures: mean
# Available intervals: 1h, 2h, 6h, 12h, 24h
# Available units: octas, p
def weather_data(selected_location):
    base_url = 'https://api.meteomatics.com'

    current_date = dt.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
    validdatetime = f"{current_date}P10D:PT12H"
    
    latitude = selected_location['lat']
    longitude = selected_location['lon']

    location = f"{latitude},{longitude}"
    format='json'
    #format = 'html'
    optionals = 'source=mix'

    # comment out and input our own id and pwd for access to https://api.meteomatics.com
    #username = 'YOUR ID'
    #password = 'YOUR PASSWORD'
    #username = 'upenn_whang_sungim'
    #password = 'OD4p6y7qO5'
    # username = 'upenn_whang_hannah'
    # password = 'g61JpgDM38'
    username= 'upenn_whang_si'
    password= '6EXl0d7fjB'


    cloud_levels = ["low", "medium", "high", "effective", "total"]
    all_cloud_data = {}

    for level in cloud_levels :
        parameters = f'{level}_cloud_cover_mean_12h:p'

        cloud_url = f'{base_url}/{validdatetime}/{parameters}/{location}/{format}?{optionals}'
        response = requests.get(cloud_url, auth=(username, password))
        cloud_data = response.json()
        all_cloud_data[level] = cloud_data

    # Function to convert to dataframes
    def process_cloud_data(cloud_data, level):
        cloud_df = pd.DataFrame(cloud_data)
        cloud_df['date'] = pd.to_datetime(cloud_df['date'])
        cloud_df.rename(columns={'value': f'{level} cloud cover mean'}, inplace=True)
        return cloud_df

    cloud_data_frames = []

    for i, level in enumerate(cloud_levels):
        cloud_data_frames.append(process_cloud_data(all_cloud_data[level]['data'][0]['coordinates'][0]['dates'], level))

    # Merge the DataFrames
    combined_df = cloud_data_frames[0]
    for i in range(1, len(cloud_data_frames)):
        combined_df = pd.merge(combined_df, cloud_data_frames[i], on='date')   
        
    # leave only total cloud cover mean 
    weather_data_df = combined_df[['date', 'total cloud cover mean']]
    
    # leave the data at night
    filtered_weather_data_df = weather_data_df[(weather_data_df['date'].dt.strftime('%H:%M') >= '20:00') & 
                                              (weather_data_df['date'].dt.strftime('%H:%M') <= '23:59') |
                                              (weather_data_df['date'].dt.strftime('%H:%M') >= '00:00') & 
                                              (weather_data_df['date'].dt.strftime('%H:%M') <= '08:00')]
    
    # convert timeframes into the form '%Y-%m-%d'
    filtered_weather_data_df.loc[:, 'date'] = pd.to_datetime(filtered_weather_data_df['date'].dt.strftime('%Y-%m-%d'))

    return  filtered_weather_data_df

# Define function to merge moon data and weather data
def moon_weather_data(moon_data_df,weather_data_df):
    moon_weather_df = pd.merge(moon_data_df,weather_data_df, on='date')
    moon_weather_df['date'] = moon_weather_df['date'].dt.strftime('%Y-%m-%d').astype('object')
    # Convert the moon_weather_df to JSON
    moon_weather_json = moon_weather_df.to_json(orient='split')  
    print(moon_weather_df)
    return moon_weather_df, moon_weather_json

#Define function to get staying places
def get_stay_places(lat, lon, radius):
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

    return stay_places_data

# Define a route for the home page
@app.route('/')
def home_stay():
    return render_template('home_stay.html', states=states)

# Define a route for getting the center of the selected state
@app.route('/get_state_location')
def get_state_location():
    selected_state = request.args.get('state')
    
    selected_location = get_coordinates(selected_state)
    
    return jsonify(selected_location) 


@app.route("/about_stay")
def about_stay():
    selected_state = request.args.get('state')  
    selected_location = get_coordinates(selected_state)
    latitude = selected_location['lat']
    longitude = selected_location['lon']

    # call function moon_data 
    moon_data_df = moon_data(selected_location)
    #all function weather_data
    weather_data_df = weather_data(selected_location)
    # merger moon_data to weather_data
    moon_weather_df, moon_weather_json = moon_weather_data(moon_data_df,weather_data_df)
    print(moon_weather_json)
    # call function get_stay_places
    stay_places_data = get_stay_places(latitude, longitude, 6000)
    #print(stay_places_data)
    return render_template('about_stay.html', data={
        'state': selected_state,
        'latitude': selected_location['lat'],
        'longitude': selected_location['lon'],
        'moon_weather_data': moon_weather_json,
        'stay_data': stay_places_data
    })


if __name__ == '__main__':
    app.run(debug=True)