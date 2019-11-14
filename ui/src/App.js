import React from 'react';

import classnames from 'classnames';

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
      queryTrackingNumber: '',
      packageList: [],
      filteredPackageList: [],
      selectedPackage: [],
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
          <div className="col col-9 h1 text-center text-white">
            {this.state.queryTrackingNumber.length > 0 ? `Tracking Number: ${this.state.queryTrackingNumber}` : null}
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
          <div className="col col-12 pl-4 pr-4 p-md-0">
            {this.renderPackageList(this.state.filteredPackageList)}
          </div>
        </div>
        <div className="row mt-4">
          <div className="col col-12 pl-4 pr-4 p-md-0">
            <iframe src={this.state.googleMapsUrl} width="100%" height="600" style={{ width: '100%', height: 600, border: 0 }} frameBorder="0" allowFullScreen></iframe>
          </div>
        </div>
      </div>
    );
  }

  renderPackageList = packageList => {
    if (packageList.length > 0) {
      return packageList.map(this.renderPackage);
    } else {
      return (
        <div className="text-center">
          {this.state.queryTrackingNumber ? 'Invalid' : 'No'} tracking number.
        </div>
      );
    }
  }
  onClickPackage = i => {
    const { filteredPackageList } = this.state;
    const selectedPackage = filteredPackageList[i];
    const height = $(`#package-${i}`).height();
    if (selectedPackage.expanded) {
      $(`#package-${i}`).css({ height });
      selectedPackage.collapsing = true;
      this.setState({ filteredPackageList });
      setTimeout(() => {
        $(`#package-${i}`).css({ height: '' });
        setTimeout(() => {
          selectedPackage.collapsing = false;
          selectedPackage.expanded = false;
          this.setState({ filteredPackageList });
        }, 350);
      });
    } else {
      selectedPackage.collapsing = true;
      this.setState({ filteredPackageList });
      setTimeout(() => {
        $(`#package-${i}`).css({ height });
        setTimeout(() => {
          $(`#package-${i}`).css({ height: '' });
          selectedPackage.collapsing = false;
          selectedPackage.expanded = true;
          this.setState({ filteredPackageList });
        }, 350);
      });
    }
    const googleMapsUrl = this.getGoogleMapsUrl(selectedPackage);
    this.setState({ googleMapsUrl });
  }
  renderPackage = (package_, i) => {
    const cardHeaderStyles = {
      'Label created': [ 'bg-secondary', 'text-white' ],
      'Picked up': [ 'bg-dark', 'text-white' ],
      'In transit': [ 'bg-primary', 'text-white' ],
      'Delivered': [ 'bg-success', 'text-white' ],
    };
    const cardHeaderStyle = cardHeaderStyles[package_.keyStatus];
    return (
      <div key={i} className="card mt-1">
        <div className={classnames('card-header', cardHeaderStyle)} onClick={() => { this.onClickPackage(i); }}>
          <FontAwesomeIcon icon={package_.expanded ? fas.faChevronDown : fas.faChevronRight} className="mr-2" />
          <b>{i + 1}.</b> {moment(package_.shipDt).format('YYYY-MM-DD')} (<b>{package_.origin}</b> → <b>{package_.destination}</b>)
        </div>
        <div id={`package-${i}`} className={classnames('card-body', 'p-0', { 'collapse': !package_.collapsing, 'show': !package_.collapsing && package_.expanded, 'collapsing': package_.collapsing })}>
          <table className="table table-sm table-hover table-striped">
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col">Date</th>
                <th scope="col">Time</th>
                <th scope="col">Location</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {this.renderScanEventList(package_.scanEventList)}
            </tbody>
            <tfoot className="text-right text-md-center">
              <tr><td colSpan={5}><small>{package_.scanEventList.length} event(s).</small></td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }
  renderScanEventList = scanEventList => {
    if (scanEventList.length > 0) {
      return scanEventList.map(this.renderScanEvent);
    } else {
      return <tr><td colSpan={4}>No event.</td></tr>;
    }
  }
  renderScanEvent = (scanEvent, i) => {
    return (
      <tr key={i}>
        <th scope="row">{i + 1}</th>
        <td>{scanEvent.date}</td>
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
    }
  }
  onClickTrack = e => {
    this.track(this.state.trackingNumber);
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
    const queryTrackingNumber = trackingNumber;
    const { data } = await axios.get(`/api/v1/track/${trackingNumber}`);
    const { successful, packageList } = data;
    const filteredPackageList = _.filter(packageList, package_ => package_.isSuccessful);
    _.forEach(filteredPackageList, package_ => {
      const { originCity, originStateCD, originCntryCD, destCity, destStateCD, destCntryCD, scanEventList } = package_;
      package_.scanEventList = _.reverse(scanEventList);
      _.forEach(package_.scanEventList, (scanEvent, i) => {
        if (i > 0 && package_.scanEventList[i - 1].date === scanEvent.date) {
          scanEvent.date = '';
        }
        return true;
      });
      const filteredScanEventList = _.filter(package_.scanEventList, scanEvent => scanEvent.scanLocation.length > 0);
      if (originCity.length === 0 && originStateCD.length === 0 && originCntryCD.length === 0) {
        if (filteredScanEventList.length > 0) {
          package_.origin = _.first(filteredScanEventList).scanLocation;
        }
      } else {
        package_.origin = _.join([ originCity, originStateCD, originCntryCD ], ', ');
      }
      if (destCity.length === 0 && destStateCD.length === 0 && destCntryCD.length === 0) {
        if (filteredScanEventList.length > 0) {
          package_.destination = _.last(filteredScanEventList).scanLocation;
        }
      } else {
        package_.destination = _.join([ destCity, destStateCD, destCntryCD ], ', ');
      }
      return true;
    });
    let selectedPackage = {};
    if (filteredPackageList.length === 1) {
      selectedPackage = _.first(filteredPackageList);
      selectedPackage.expanded = true;
    }
    const googleMapsUrl = this.getGoogleMapsUrl(selectedPackage);
    this.setState({ trackingNumber: '', queryTrackingNumber, packageList, filteredPackageList, selectedPackage, googleMapsUrl });
  }
  getGoogleMapsUrl = package_ => {
    const url = new URL(GOOGLE_MAPS_URL);
    url.searchParams.append('key', this.state.apiKey);
    let [ origin, destination ] = [ '.', '.' ];
    if (!_.isEmpty(package_)) {
      ({ origin, destination } = package_);
      const filteredScanEventList = _.filter(package_.scanEventList, scanEvent => scanEvent.scanLocation.length > 0);
    if (filteredScanEventList.length > 0) {
        const waypoints = _.chain(filteredScanEventList).map(scanEvent => scanEvent.scanLocation).join('|').value();
      url.searchParams.append('waypoints', waypoints);
    }
    }
    url.searchParams.append('origin', origin);
    url.searchParams.append('destination', destination);
    return url.toString();
  }
}

export default App;
