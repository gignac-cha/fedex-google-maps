import React from 'react';

import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';
import axios from 'axios';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Add all icons to the library so you can use it in your page
library.add(fas, far, fab);

const GOOGLE_MAPS_URL = 'https://www.google.com/maps/embed/v1/directions';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      trackingNumber: '',
      origin: '',
      destination: '',
      scanEventList: [],
      apiKey: '',
      googleMapsUrl: '',
    };
  }
  componentDidMount() {
    this.getApiKey();
  }
  render() {
    return (
      <div className="container p-4">
        <div className="row mt-4">
          <div className="col col-12 p-4" style={{ backgroundColor: '#4d148c' }}>
            <img src="https://www.fedex.com/content/dam/fedex-com/logos/logo.png" height="40" />
            <img src="https://www.gstatic.com/images/branding/product/2x/maps_512dp.png" height="50" />
          </div>
        </div>
        <div className="row mt-4">
          <label htmlFor="trackingNumber" className="col col-12 offset-md-2 col-md-2">Tracking Number</label>
          <input id="trackingNumber" className="col col-12 col-md-4 form-control" value={this.state.trackingNumber} onChange={this.onChangeTrackingNumber} onKeyUp={this.onKeyUpTrackingNumber} />
          <div className="col col-12 col-md-2">
            <button className="btn btn-primary" onClick={this.onClickTrack}>Track!</button>
          </div>
        </div>
        <div className="row mt-4">
          <table className="table table-sm table-hover table-striped">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Time</th>
                <th scope="col">Location</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {this.state.scanEventList.length > 0 ? this.state.scanEventList.map(this.renderScanEventList) : <tr><td colSpan={4}>No event.</td></tr>}
            </tbody>
            <tfoot className="text-right">
              {this.state.origin && this.state.destination ? <tr><td colSpan={4}>{this.state.origin} → {this.state.destination}</td></tr> : null}
            </tfoot>
          </table>
        </div>
        <div className="row mt-4">
          <iframe src={this.state.googleMapsUrl} width="100%" height="600" style={{ width: '100%', height: 600, border: 0 }} frameBorder="0" allowFullScreen></iframe>
        </div>
      </div>
    );
  }

  renderScanEventList = (scanEvent, i) => {
    return (
      <tr key={i}>
        <td>{i > 0 && this.state.scanEventList[i - 1].date === scanEvent.date ? '' : scanEvent.date}</td>
        <td>{scanEvent.time}</td>
        <td>{scanEvent.scanLocation}</td>
        <td>{scanEvent.status}</td>
      </tr>
    );
  }

  onChangeTrackingNumber = e => {
    const trackingNumber = e.currentTarget.value;
    this.setState({ trackingNumber });
  }
  onKeyUpTrackingNumber = e => {
    if (e.keyCode === 0x0D) {
      this.track(this.state.trackingNumber);
      this.setState({ trackingNumber: '' });
    }
  }
  onClickTrack = e => {
    this.track(this.state.trackingNumber);
    this.setState({ trackingNumber: '' });
  }

  getApiKey = async () => {
    const { data } = await axios.get('/api/v1/api-key');
    const { apiKey } = data;
    const url = new URL(GOOGLE_MAPS_URL);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('origin', 'California');
    url.searchParams.append('destination', 'Delaware');
    const googleMapsUrl = url.toString();
    this.setState({ apiKey, googleMapsUrl });
  }
  track = async trackingNumber => {
    const { data } = await axios.get(`/api/v1/track/${trackingNumber}`);
    const { successful, originCity, originStateCD, originCntryCD, destCity, destStateCD, destCntryCD, scanEventList } = data;
    const first = _.first(scanEventList);
    const last = _.last(scanEventList);
    const origin = `${originCity}, ${originStateCD}, ${originCntryCD}`;
    const destination = `${destCity}, ${destStateCD}, ${destCntryCD}`;
    const url = new URL(GOOGLE_MAPS_URL);
    url.searchParams.append('key', this.state.apiKey);
    url.searchParams.append('origin', origin);
    url.searchParams.append('destination', destination);
    const filteredScanEventList = _.filter(scanEventList, scanEvent => scanEvent.scanLocation.length > 0);
    if (filteredScanEventList.length > 0) {
      const waypoints = _.chain(filteredScanEventList).reverse().map(scanEvent => scanEvent.scanLocation).join('|').value();
      url.searchParams.append('waypoints', waypoints);
    }
    const googleMapsUrl = url.toString();
    this.setState({ origin, destination, scanEventList, googleMapsUrl });
  }
}

export default App;
