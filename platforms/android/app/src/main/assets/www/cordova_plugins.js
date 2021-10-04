cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "@ionic-enterprise/intune.ionicintune",
      "file": "plugins/@ionic-enterprise/intune/cordova/www/ionicintune.js",
      "pluginId": "@ionic-enterprise/intune",
      "clobbers": [
        "IntuneMAM"
      ],
      "runs": true
    },
    {
      "id": "cordova-plugin-ionic-webview.IonicWebView",
      "file": "plugins/cordova-plugin-ionic-webview/src/www/util.js",
      "pluginId": "cordova-plugin-ionic-webview",
      "clobbers": [
        "Ionic.WebView"
      ]
    }
  ];
  module.exports.metadata = {
    "@ionic-enterprise/intune": "2.0.0",
    "cordova-plugin-ionic-webview": "5.0.0"
  };
});