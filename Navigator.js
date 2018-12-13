import React from 'react';
import { View } from 'react-native';
import { createAppContainer, createStackNavigator } from 'react-navigation';
import Home from './Home';
import MyVideos from './MyVideos';
import VideoRecorder from './VideoRecorder';


const Navigator = createStackNavigator({
  Home: {
    screen: Home
  },
  MyVideos: {
    screen: MyVideos
  },
  VideoRecorder: {
    screen: VideoRecorder
  }
});

export default NavContainer = createAppContainer(Navigator);

