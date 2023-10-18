from flask import Flask, render_template, request
import requests
import datetime as dt
import pandas as pd
import json
import pytz
from US_states_data import states

# Import the API key
from config import geoapify_key


app = Flask(__name__)
current_date = dt.datetime.now().strftime("%Y-%m-%d")

# Define function to fild location of one place in the selected state
def get_coordinates(selected_state):
    #target_location = f"center of {selected_state}"
    target_url = f"https://api.geoapify.com/v1/geocode/search?text={selected_state}&format=json&apiKey={geoapify_key}"

    # Run a request to the endpoint and convert the result to JSON
    geo_data = requests.get(target_url).json()

    # Extract latitude and longitude
    lat = geo_data["results"][0]["lat"]
    lon = geo_data["results"][0]["lon"]

    return lat, lon

#Defind function to get moon data
# moon data : phase of moon
# moon_URL = f'https://aa.usno.navy.mil/api/moon/phases/date?date={current_date}&nump=50'
def moon_data(lat,lon):

    # moon_phases = requests.get(moon_URL).json()
    # # Filter the data for the year 2023
    # filtered_data = [phase for phase in moon_phases['phasedata'] if phase['year'] == 2023]
    # return filtered_data
    time_str = "00:00"
    moon_data_list = []
    for i in range(11):
        current_date = (dt.date.today() + dt.timedelta(days=i)).strftime("%Y-%m-%d")

        celestial_URL = f"https://aa.usno.navy.mil/api/celnav?date={current_date}&tz=-9&time={time_str}&coords={lat},{lon}"
        celestial_data = requests.get(celestial_URL).json()
        moon_illum = celestial_data['properties']['moon_illum']
        moon_phase = celestial_data['properties']['moon_phase']
        moon_data_list.append({
        'date': current_date,
        'moon_illumination': moon_illum,
        'moon_phase': moon_phase
        })
    return moon_data_list

# Defind function to get weather data
# Cloud forecast for 10 days from today
# Available levels: low, medium, high, effective, total
# Available measures: mean
# Available intervals: 1h, 2h, 6h, 12h, 24h
# Available units: octas, p
def weather_data(lat,lon):
    base_url = 'https://api.meteomatics.com'

    current_date = dt.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
    validdatetime = f"{current_date}P10D:PT12H"

    location = f"{lat},{lon}"
    format='json'
    #format = 'html'
    optionals = 'source=mix'

    # comment out and input our own id and pwd for access to https://api.meteomatics.com
    #username = 'YOUR ID'
    #password = 'YOUR PASSWORD'

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
        cloud_df.set_index('date', inplace=True)
        cloud_df.index = cloud_df.index.strftime('%Y-%m-%d %H:%M')
        cloud_df.rename(columns={'value': f'{level} cloud cover mean'}, inplace=True)
        return cloud_df

    cloud_data_frames = []

    for i, level in enumerate(cloud_levels):
        cloud_data_frames.append(process_cloud_data(all_cloud_data[level]['data'][0]['coordinates'][0]['dates'], level))

    # Merge the DataFrames
    combined_df = cloud_data_frames[0]
    for i in range(1, len(cloud_data_frames)):
        combined_df = pd.merge(combined_df, cloud_data_frames[i], on='date')   

    # Convert the combined DataFrame to JSON
    combined_weather_json = combined_df.to_json(orient='split')    
    return combined_weather_json


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
            print(camping_data)
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
            print(accommodation_data)
        except KeyError:
            pass

    return stay_places_data

# Define a route for the home page
@app.route('/')
def home_stay():
    return render_template('home_stay.html', states=states)

# Define a route for getting the center of the selected state
@app.route('/get_state_center')
def get_state_center():
    selected_state = request.args.get('state')
    print(selected_state)
    lat, lon = get_coordinates(selected_state)
    
    return jsonify({'state': selected_state, 'latitude': lat, 'longitude': lon}) 


@app.route("/about_stay")
def about_stay():
    selected_state = request.args.get('state')  
    lat, lon = get_coordinates(selected_state)
    print(selected_state)
    moon_data_list = moon_data(lat,lon)
    combined_weather_json = weather_data(lat,lon)
    stay_places_data = get_stay_places(lat, lon, 6000)
    return render_template('about_stay.html', data={
        'state': selected_state,
        'latitude': lat,
        'longitude': lon,
        'moon_data': moon_data_list,
        'weather_data': combined_weather_json,
        'stay_data': stay_places_data
    })

if __name__ == '__main__':
    app.run(debug=True)