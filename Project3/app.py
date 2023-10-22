from flask import Flask, jsonify, render_template, request, session
from flask_cors import CORS
import requests
import datetime as dt
import pandas as pd
import json
# pip install -U flask-cors

app = Flask(__name__)
CORS(app)

current_date = dt.datetime.now().strftime("%Y-%m-%d")

def moon_data(selected_location):
    # moon_phases = requests.get(moon_URL).json()
    # # Filter the data for the year 2023
    # filtered_data = [phase for phase in moon_phases['phasedata'] if phase['year'] == 2023]
    # return filtered_data
    latitude = selected_location[0]
    longitude = selected_location[1]
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
    return moon_data_list

#  Defind function to get weather data : Cloud forecast for 10 days from today
# Available levels: low, medium, high, effective, total , Available measures: mean
# Available intervals: 1h, 2h, 6h, 12h, 24h  , Available units: octas, p
def weather_data(selected_location):
    base_url = 'https://api.meteomatics.com'

    current_date = dt.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
    validdatetime = f"{current_date}P10D:PT12H"
    
    latitude = selected_location[0]
    longitude = selected_location[1]

    location = f"{latitude},{longitude}"
    format='json'
    #format = 'html'
    optionals = 'source=mix'

    # input our own id and pwd for https://api.meteomatics.com
    #username = 'YOUR ID'
    #password = 'YOUR PASSWORD'

    # cloud_levels = ["low", "medium", "high", "effective", "total"]
    # all_cloud_data = {}

    # for level in cloud_levels :
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

##test for moon_data function
# selected_location = [39.952583, -75.165222] 
# moon_data_json = moon_data(selected_location)
# weather_data_json = weather_data(selected_location)
# moon_weather_json = combined_data(moon_data_json,weather_data_json)
# print(moon_weather_json)

# @app.route('/')
# def home():
#     return render_template('index_han.html')

@app.route("/api/v1.0/moon-weather-data", methods=['POST'])
def moon_data_request():
    selected_location = request.get_json()
    print('selected_location')
    print(selected_location)
    moon_data_json = moon_data(selected_location)
    print('moon_data_json')
    print(moon_data_json)
    weather_data_json = weather_data(selected_location)
    print('weather_data_json')
    print(weather_data_json)
    moon_weather_data_json = combined_data(moon_data_json,weather_data_json)
    print('moon_weather_data_json')
    print(moon_weather_data_json)
    return jsonify(moon_weather_data_json)

if __name__ == '__main__':
    app.run(debug=True)