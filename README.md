# fedex-google-maps
FedEx tracking number to Google Maps

## Environments

### Python Flask
* `python==3.8.0`
* `Flask==1.1.1`
* `requests==2.22.0`
* `lxml==4.4.1`
* `cssselect==1.1.0`

### Node.js React
* `node v13.1.0`
* `npm@6.13.0`
* `yarn@1.19.1`
* `create-react-app@3.2.0`
* `react@16.11.0`

## Builds

### Build React
```bash
$ cd ui
$ yarn build
```
Bundle files will be moved to `web/static`.

## Preparations

### Google Maps API Key
* Generate Directions API Key from here: https://cloud.google.com/maps-platform/routes/

## Deployments

* Need environment variable `API_KEY` to Google Maps API Key
```bash
$ export API_KEY=<YOUR_API_KEY>
$ export FLASK_APP=web
$ flask run
```
