import React, { Component } from 'react';
import $ from 'jquery';
import './Map.css';
import { Map, TileLayer, GeoJSON, LayersControl, Marker, Popup } from 'react-leaflet';
import { ckmeans } from 'simple-statistics';

const { BaseLayer, Overlay } = LayersControl

export default class MapComponent extends Component {

  constructor(props) {
    super(props);

    this.shadingColors = ['#eff3ff','#bdd7e7','#6baed6','#3182bd','#08519c'];

    this.state = {
      cityGeoJson: null,
      greenwaysGeoJson: null,
      parksGeoJson: null,
      povertyGeoJson: null,
      incomeGeoJson: null,
      housingGeoJson: null,
      povertyRanges: null,
      incomeRanges: null,
      housingRanges: null
    };

    this.styleFeature = this.styleFeature.bind(this);
    this.renderPopup = this.renderPopup.bind(this);
    this.addProperties = this.addProperties.bind(this);
  }

  componentWillMount() {
    const self = this;
    const cityRequest = $.ajax({
      type: "GET",
      url: "https://opendata.arcgis.com/datasets/bd5873b228e74eb6836066d6c7351e49_0.geojson"
    });
    const greenwaysRequest = $.ajax({
      type: "GET",
      url: "https://opendata.arcgis.com/datasets/79ecc55fc064472c897f09e28dea473c_0.geojson"
    });
    const parksRequest = $.ajax({
      type: "GET",
      url: "https://opendata.arcgis.com/datasets/127fd263dfc64a73a2c2815c9d65b1d5_0.geojson"
    });
    const povertyRequest = $.ajax({
      type: "GET",
      url: "https://opendata.arcgis.com/datasets/909709016b6d41708d0fad23f8355aa1_0.geojson"
    });
    const incomeRequest = $.ajax({
      type: "GET",
      url: "https://opendata.arcgis.com/datasets/43237025f97e41f3bed70dd2203f8317_0.geojson"
    });
    const housingRequest = $.ajax({
      type: "GET",
      url: "https://opendata.arcgis.com/datasets/77adfcaf3d4d4361b8b6c4a57f0254b9_0.geojson"
    });
    $.when(cityRequest, greenwaysRequest, parksRequest, povertyRequest, incomeRequest, housingRequest).done(function(cityResponse, greenwaysResponse, parksResponse, povertyResponse, incomeResponse, housingResponse) {
      const povertyRanges = self.generateRanges(povertyResponse[0].features, "percent_be");
      const incomeRanges = self.generateRanges(incomeResponse[0].features, "median_inc");
      const housingRanges = self.generateRanges(housingResponse[0].features, "median_mon");
      self.addProperties(povertyResponse[0].features, povertyRanges, "percent_be", { format: "percent" });
      self.addProperties(incomeResponse[0].features, incomeRanges, "median_inc", { format: "currency" });
      self.addProperties(housingResponse[0].features, housingRanges, "median_mon", { format: "currency" });

      self.setState({
        cityGeoJson: cityResponse[0],
        greenwaysGeoJson: greenwaysResponse[0],
        parksGeoJson: parksResponse[0],
        povertyGeoJson: povertyResponse[0],
        incomeGeoJson: incomeResponse[0],
        housingGeoJson: housingResponse[0],
        povertyRanges: povertyRanges,
        incomeRanges: incomeRanges,
        housingRanges: housingRanges
      });
    });
  };

  generateRanges = function(features, propertyName) {
    const values = [];
    features.forEach(function(feature) {
      values.push(feature.properties[propertyName]);
    });
    const ranges = ckmeans(values, 5);
    const newShadingRanges = [];
    ranges.forEach(function(range) {
      newShadingRanges.push({
        min: range[0],
        max: range[range.length - 1]
      });
    });

    return newShadingRanges;
  }

  addProperties(features, ranges, property, options) {
    const self = this;
    features.forEach(function(feature) {
      let color = "#000";
      for (var i = 0; i < ranges.length; i++) {
        if (feature.properties[property] >= ranges[i].min && feature.properties[property] <= ranges[i].max) {
          color = self.shadingColors[i];
          break;
        }
      }
      feature.properties.color = color;

      feature.properties.tooltipValue = null;
      switch (options.format) {
        case "percent":
          feature.properties.tooltipValue = feature.properties[property] * 100 + "%";
          break;
        case "currency":
          feature.properties.tooltipValue = "$" + feature.properties[property].toLocaleString();
          break;
        default:
          feature.properties.tooltipValue = feature.properties[property];
      }
    });
  }

  cityStyle = {
    color: "#333",
    weight: 3,
    fillOpacity: 0
  };

  greenspaceStyle = {
    color: "#006d2c",
    fillOpacity: 1,
    weight: 2
  };

  styleFeature = function(feature, ranges) {
    return  {
      color: "#333",
      fillColor:feature.properties.color,
      fillOpacity: 0.5,
      weight: 1
    }
  };

  renderPopup = function(feature, layer) {
    const tooltip = "<h4>" + feature.properties.namelsad + ": " + feature.properties.tooltipValue + "</h4>";
    layer.bindTooltip(tooltip);
  };

  render() {
    const position = [35.56, -82.5515];
    const zoom = 11;
    const city = this.state.cityGeoJson ? <GeoJSON data={this.state.cityGeoJson} style={this.cityStyle} /> : null;
    const greenways = this.state.greenwaysGeoJson ? <GeoJSON data={this.state.greenwaysGeoJson} style={this.greenspaceStyle} /> : null;
    const parks = this.state.parksGeoJson ? <GeoJSON data={this.state.parksGeoJson} style={this.greenspaceStyle} /> : null;
    const povertyLayer = this.state.povertyGeoJson
      ? <BaseLayer name="Percent Below Poverty">
          <GeoJSON data={this.state.povertyGeoJson} style={this.styleFeature} onEachFeature={this.renderPopup} />
        </BaseLayer>
      : null;
    const incomeLayer = this.state.incomeGeoJson
      ? <BaseLayer name="Median Household Income">
          <GeoJSON data={this.state.incomeGeoJson} style={this.styleFeature} onEachFeature={this.renderPopup} />
        </BaseLayer>
      : null;
    const housingLayer = this.state.housingGeoJson
      ? <BaseLayer checked name="Median Monthly Housing Cost">
          <GeoJSON data={this.state.housingGeoJson} style={this.styleFeature} onEachFeature={this.renderPopup} />
        </BaseLayer>
      : null;

    return (
      <Map center={position} zoom={zoom}>
        <TileLayer
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
          attribution="&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>, &copy;<a href='https://carto.com/attribution'>CARTO</a>"
        />
        <LayersControl position="topright">
          {housingLayer}
          {incomeLayer}
          {povertyLayer}
        </LayersControl>

        {greenways}
        {parks}
      </Map>
    );
  }
}
