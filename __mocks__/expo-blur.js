'use strict';

const React = require('react');
const { View } = require('react-native');

const BlurView = function MockBlurView(props) {
  return React.createElement(View, props);
};

module.exports = { BlurView };
