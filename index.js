import React, {Component} from 'react';

import {Image, Dimensions, View} from 'react-native';

import {sha256} from 'react-native-sha256';

var RNFS = require('react-native-fs');

class CachedImage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      image_uri: this.props.placeholder,
      rectTop: 0,
      rectBottom: 0,
    };
    if (!this.props.lazy_load) {
      this.loadFile(this.props.image_uri);
    }
  }

  componentDidMount() {
    if (!this.props.disabled) {
      this.startWatching();
    }
  }

  componentWillUnmount() {
    this.stopWatching();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.disabled) {
      this.stopWatching();
    } else {
      this.lastValue = null;
      this.startWatching();
    }
  }

  startWatching() {
    if (this.interval) {
      return;
    }
    this.interval = setInterval(() => {
      if (!this.myview) {
        return;
      }
      this.myview.measure((x, y, width, height, pageX, pageY) => {
        this.setState({
          rectTop: pageY,
          rectBottom: pageY + height,
          rectWidth: pageX + width,
        });
      });
      this.isInViewPort();
    }, this.props.delay || 100);
  }

  stopWatching() {
    this.interval = clearInterval(this.interval);
  }

  isInViewPort() {
    const window = Dimensions.get('window');
    const isVisible =
      this.state.rectBottom !== 0 &&
      this.state.rectTop >= 0 &&
      this.state.rectBottom <= window.height &&
      this.state.rectWidth > 0 &&
      this.state.rectWidth <= window.width;
    if (this.lastValue !== isVisible) {
      this.lastValue = isVisible;
      this.loadFile(this.props.image_uri);
    }
  }

  loadFile = (url) => {
    return new Promise((resolve, reject) => {
      // Create a SHA256 hash for the file name so that it is always same for this URL
      sha256(url)
        .then((hash) => {
          // get the format of the file from the URL
          let format = url.split('?')[0].split('.').slice(-1).pop();
          // Generate file path for local dir
          let filepath = RNFS.DocumentDirectoryPath + '/' + hash + '.' + format;
          // Check if file exists locally
          RNFS.exists(filepath).then((exists) => {
            // If file exists pass the filepath as is
            if (exists) {
              this.setState({
                image_uri: 'file://' + filepath,
              });
              resolve(filepath);
            } else {
              // If file doesnt exists download it
              RNFS.downloadFile({fromUrl: url, toFile: filepath}).promise.then(
                (r) => {
                  this.setState({
                    image_uri: 'file://' + filepath,
                  });
                  resolve(filepath);
                },
              );
            }
          });
        })
        .catch((err) => {
          console.log(err.message);
        });
    });
  };

  render() {
    return (
      <>
        <View>
          <Image
            ref={(component) => {
              this.myview = component;
            }}
            style={{width: 400, height: 400}}
            source={{
              uri: this.state.image_uri,
            }}
          />
        </View>
      </>
    );
  }

}


export default CachedImage;