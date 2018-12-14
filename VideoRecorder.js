import React from 'react';
import { Button, Text, Header, Body, Icon, Title, Spinner } from 'native-base';
import { Camera, Permissions, FileSystem } from 'expo';
import { StyleSheet, View, TouchableOpacity, Slider, Platform } from 'react-native';
import Layout from './Layout';
import delay from 'delay';
import shortid from 'shortid';
import {
  Ionicons,
  MaterialIcons,
  Foundation,
  MaterialCommunityIcons,
  Octicons
} from '@expo/vector-icons';

const endpoint = 'http://localhost:3000';

const flashModeOrder = {
  off: 'on',
  on: 'auto',
  auto: 'torch',
  torch: 'off',
};

const flashIcons = {
  off: 'flash-off',
  on: 'flash-on',
  auto: 'flash-auto',
  torch: 'highlight'
};

const wbOrder = {
  auto: 'sunny',
  sunny: 'cloudy',
  cloudy: 'shadow',
  shadow: 'fluorescent',
  fluorescent: 'incandescent',
  incandescent: 'auto',
};

const wbIcons = {
  auto: 'wb-auto',
  sunny: 'wb-sunny',
  cloudy: 'wb-cloudy',
  shadow: 'beach-access',
  fluorescent: 'wb-iridescent',
  incandescent: 'wb-incandescent',
};


class RedirectTo extends React.Component {
  componentDidMount() {
    const { scene, navigation } = this.props;
    navigation.navigate(scene);
  }

  render() {
    return <View />;
  }
}

const printChronometer = seconds => {
  const minutes = Math.floor(seconds / 60);
  const remseconds = seconds % 60;
  return '' + (minutes < 10 ? '0' : '') + minutes + ':' + (remseconds < 10 ? '0' : '') + remseconds;
};

export default class VideoRecorder extends React.Component {
  static navigationOptions = {
    header: () => (
      <Header>
        <Body>
          <Title>My videos</Title>
        </Body>
      </Header>
    )
  };

  state = {
    hasCameraPermission: null,
    type: Camera.Constants.Type.front,
    recording: false,
    duration: 0,
    redirect: false,
    flash: 'off',
    zoom: 0,
    autoFocus: 'on',
    whiteBalance: 'auto',
    ratio: '4:3',
    ratios: [],
    barcodeScanning: false,
    faceDetecting: false,
    faces: [],
    newPhotos: false,
    permissionsGranted: false,
    pictureSize: undefined,
    pictureSizes: [],
    pictureSizeId: 0,
    showGallery: false,
    showMoreOptions: false,
  };

  async componentWillMount() {
    const { status: cameraStatus } = await Permissions.askAsync(Permissions.CAMERA);
    const { status: audioStatus } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    this.setState({ hasCameraPermission: cameraStatus === 'granted' && audioStatus === 'granted' });
  }

  async registerRecord() {
    const { recording, duration } = this.state;
    if (recording) {
      await delay(1000);
      this.setState(state => ({
        ...state,
        duration: state.duration + 1
      }));
      this.registerRecord();
    }
  }

  componentDidMount() {
    FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'video').catch(e => {
      console.log(e, 'Directory exists');
    });
  }

  startRecording = () => {
    if (!this.camera) {
      return;
    }
    this.setState(state => ({ ...state, recording: true }));
    this.registerRecord();
    // const { codec = 'mp4', record } = this.camera.recordAsync();
    this.camera.recordAsync({ 
      quality: Camera.Constants.VideoQuality['1080p'],
      // onVideoSaved: this.onVideoSaved
    });
    const videoId = shortid.generate();   
  }

  onVideoSaved = async video => {
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}videos/`, {
      intermediates: true
    });
    await FileSystem.moveAsync({
      from: video.uri,
      to: `${FileSystem.documentDirectory}videos/demo_${videoId}.mp4`
    });
    console.log(`${FileSystem.documentDirectory}videos/demo_${videoId}.mp4`);
    this.setState(state => ({ ...state, redirect: 'MyVideos' }));
  }

  async stopRecording() {
    if (!this.camera) {
      return;
    }
    await this.camera.stopRecording();
    this.setState(state => ({ ...state, recording: false, duration: 0 }));
  }

  getRatios = async () => {
    const ratios = await this.camera.getSupportedRatios();
    return ratios;
  };

  toggleFlash = () => this.setState({ flash: flashModeOrder[this.state.flash] });

  toggleView = () => this.setState({ showGallery: !this.state.showGallery, newPhotos: false });

  toggleFacing = () => this.setState({ type: this.state.type === 'back' ? 'front' : 'back' });

  setRatio = ratio => this.setState({ ratio });

  toggleWB = () => this.setState({ whiteBalance: wbOrder[this.state.whiteBalance] });

  toggleFocus = () => this.setState({ autoFocus: this.state.autoFocus === 'on' ? 'off' : 'on' });

  zoomOut = () => this.setState({ zoom: this.state.zoom - 0.1 < 0 ? 0 : this.state.zoom - 0.1 });

  zoomIn = () => this.setState({ zoom: this.state.zoom + 0.1 > 1 ? 1 : this.state.zoom + 0.1 });

  setFocusDepth = depth => this.setState({ depth });

  takePicture = () => {
    if (this.camera) {
      this.camera.takePictureAsync({ onPictureSaved: this.onPictureSaved });
    }
  };

  toggleRecording() {
    const { recording } = this.state;
    return recording ? this.stopRecording() : this.startRecording();
  }

  // onPictureSaved = async photo => {
  //   await FileSystem.moveAsync({
  //     from: photo.uri,
  //     to: `${FileSystem.documentDirectory}photos/${Date.now()}.jpg`,
  //   });
  //   this.setState({ newPhotos: true });
  // }

  collectPictureSizes = async () => {
    if (this.camera) {
      const pictureSizes = await this.camera.getAvailablePictureSizesAsync(this.state.ratio);
      let pictureSizeId = 0;
      if (Platform.OS === 'ios') {
        pictureSizeId = pictureSizes.indexOf('High');
      } else {
        // returned array is sorted in ascending order - default size is the largest one
        pictureSizeId = pictureSizes.length - 1;
      }
      this.setState({ pictureSizes, pictureSizeId, pictureSize: pictureSizes[pictureSizeId] });
    }
  };


  renderTopBar = () =>
    <View
      style={styles.topBar}>
      <TouchableOpacity style={styles.toggleButton} onPress={this.toggleFacing}>
        <Ionicons name="ios-reverse-camera" size={32} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={this.toggleFlash}>
        <MaterialIcons name={flashIcons[this.state.flash]} size={32} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={this.toggleWB}>
        <MaterialIcons name={wbIcons[this.state.whiteBalance]} size={32} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={this.toggleFocus}>
        <Text style={[styles.autoFocusLabel, { color: this.state.autoFocus === 'on' ? "white" : "#6b6b6b" }]}>AF</Text>
      </TouchableOpacity>
    </View>

  renderBottomBar = () =>
    <View
      style={styles.bottomBar}>
      <TouchableOpacity style={styles.bottomButton} onPress={this.toggleMoreOptions}>
        <Octicons name="kebab-horizontal" size={30} color="white" />
      </TouchableOpacity>
      <View style={{ flex: 0.4 }}>
        <TouchableOpacity
          onPress={this.takePicture}
          style={{ alignSelf: 'center' }}
        >
          <Ionicons name="ios-radio-button-on" size={70} color="white" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.bottomButton} onPress={this.toggleView}>
        <View>
          <Foundation name="thumbnails" size={30} color="white" />
          {this.state.newPhotos && <View style={styles.newPhotosDot} />}
        </View>
      </TouchableOpacity>
    </View>





  render() {
    const { hasCameraPermission, recording, duration, redirect } = this.state;

    if (redirect) {
      return <RedirectTo scene={redirect} navigation={this.props.navigation} />;
    }

    if (hasCameraPermission === null) {
      return (
        <Layout style={styles.containerCenter}>
          <Spinner />
        </Layout>
      );
    } else if (hasCameraPermission === false) {
      return (
        <Layout style={styles.containerCenter}>
          <Text>No access to camera</Text>;
        </Layout>
      );
    } else {
      return (
        <Layout style={styles.containerCenter}>
          <Camera
            style={styles.containerCamera}
            type={this.state.type}
            ref={ref => {
              this.camera = ref;
            }}
            flashMode={this.state.flash}
          >
            <View style={styles.topActions}>
              {recording && (
                <Button iconLeft transparent light small style={styles.chronometer}>
                  <Icon ios="ios-recording" android="md-recording" />
                  <Text>{printChronometer(duration)}</Text>
                </Button>
              )}
              {!recording && <View />}

              <Button
                small
                transparent
                success
                style={styles.flipCamera}
                onPress={() => {
                  this.setState({
                    type:
                      this.state.type === Camera.Constants.Type.back
                        ? Camera.Constants.Type.front
                        : Camera.Constants.Type.back
                  });
                }}
              >
                <Icon ios="ios-reverse-camera" android="md-reverse-camera" />
              </Button>
            </View>
            <View style={styles.buttonActions}>
              <Button transparent onPress={() => this.setState({ redirect: 'Home' })}>
                <Icon ios="ios-home" android="md-home" />
              </Button>
              <Button
                danger
                onPress={() => {
                  this.toggleRecording();
                }}
              >
                {recording ? (
                  <Icon ios="ios-square" android="md-square" />
                ) : (
                    <Icon ios="ios-radio-button-on" android="md-radio-button-on" />
                  )}
              </Button>
              <Button transparent onPress={() => this.setState({ redirect: 'MyVideos' })}>
                <Icon ios="ios-folder" android="md-folder" />
              </Button>
            </View>
            {this.renderTopBar()}
            {this.renderBottomBar()}
          </Camera>
        </Layout>
      );
    }
  }
}

const styles = StyleSheet.create({
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  flipCamera: {
    margin: 10
  },
  chronometer: {
    margin: 10
  },
  buttonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 10
  },
  containerCenter: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  containerCamera: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  topBar: {
    flex: 0.2,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 5,
  },
  bottomBar: {
    paddingBottom: 5,
    backgroundColor: 'transparent',
    alignSelf: 'flex-end',
    justifyContent: 'space-between',
    flex: 0.12,
    flexDirection: 'row',
  }
});