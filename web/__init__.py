# -*- coding: utf-8 -*-

import flask

import os
import json
import urllib

import requests
import lxml.etree

server = flask.Flask(__name__, static_url_path='')

@server.route('/')
def index():
  return server.send_static_file("index.html")

@server.route("/api/v1/track/<int:trackingNumber>")
def _api_get_track(trackingNumber):
  url = "https://www.fedex.com/trackingCal/track"
  data = {
    "TrackPackagesRequest": {
      "appType": "WTRK",
      "appDeviceType": "DESKTOP",
      "supportHTML": True,
      "supportCurrentLocation": True,
      "uniqueKey": "",
      "processingParameters": {},
      "trackingInfoList": [
        {
          "trackNumberInfo": {
            "trackingNumber": trackingNumber,
            "trackingQualifier": "",
            "trackingCarrier": ""
          }
        }
      ]
    }
  }
  data = {
    "data": json.dumps(data),
    "action": "trackpackages",
    "locale": "en_US",
    "version": 1,
    "format": "json",
  }
  response = requests.post(url, data=data)
  if not response.ok:
    return flask.jsonify({})

  try:
    data = response.json()
    TrackPackagesResponse = data["TrackPackagesResponse"]
    successful = TrackPackagesResponse["successful"]
    packageList = TrackPackagesResponse["packageList"]
    for package in packageList:
      originCity = package["originCity"]
      originStateCD = package["originStateCD"]
      originCntryCD = package["originCntryCD"]
      destCity = package["destCity"]
      destStateCD = package["destStateCD"]
      destCntryCD = package["destCntryCD"]
      scanEventList = list({
        "date": scanEvent["date"],
        "gmtOffset": scanEvent["gmtOffset"],
        "scanLocation": scanEvent["scanLocation"],
        "status": scanEvent["status"],
        "statusCD": scanEvent["statusCD"],
        "time": scanEvent["time"],
      } for scanEvent in package["scanEventList"])
      return flask.jsonify(successful=successful,
        originCity=originCity, originStateCD=originStateCD, originCntryCD=originCntryCD,
        destCity=destCity, destStateCD=destStateCD, destCntryCD=destCntryCD,
        scanEventList=scanEventList)
  except:
    pass
  return flask.jsonify({})

@server.route("/api/v1/api-key")
def _api_get_api_key():
  apiKey = os.getenv("API_KEY")
  return flask.jsonify(apiKey=apiKey)

if __name__ == "__main__":
  server.run()
