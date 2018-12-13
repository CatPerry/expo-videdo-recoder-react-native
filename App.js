import React from 'react';
import { View } from 'react-native';
import NavContainer from './Navigator';
import Home from './Home';
import MyVideos from './MyVideos';
import VideoRecorder from './VideoRecorder';

// h/t to https://github.com/ajchambeaud/video-recorder

class Root extends React.Component {
  state = {
    loaded: false
  };

  async componentWillMount() {
    await Expo.Font.loadAsync({
      Roboto: require('native-base/Fonts/Roboto.ttf'),
      Roboto_medium: require('native-base/Fonts/Roboto_medium.ttf')
    });

    this.setState({ loaded: true });
  }

  render() {
    const { loaded } = this.state;

    console.log('render', loaded);
    return loaded ? <NavContainer /> : <View />;
  }
}

export default Root;



