import { Component, NgZone } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { BLE } from '@ionic-native/ble';
import { Dialogs } from '@ionic-native/dialogs';
import { LoadingController } from 'ionic-angular';

@Component({
  selector: 'page-detail',
  templateUrl: 'detail.html',
})
export class DetailPage {

  peripheral: any = {};
  statusMessage: string;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private ble: BLE,
    private toastCtrl: ToastController,
    private dialogs: Dialogs,
    public loadingCtrl: LoadingController,
    private ngZone: NgZone) {

    let device = navParams.get('device');

    this.setStatus('Connecting to ' + device.name || device.id);

    this.ble.connect(device.id).subscribe(
      peripheral => this.onConnected(peripheral),
      peripheral => this.onDeviceDisconnected(peripheral)
    );

  }

  onConnected(peripheral) {
    this.ngZone.run(() => {
      this.setStatus('');
      this.peripheral = peripheral;
      console.log(this.peripheral, 'onconnect');
    });
  }

  onDeviceDisconnected(peripheral) {
    let toast = this.toastCtrl.create({
      message: 'The peripheral unexpectedly disconnected',
      duration: 3000,
      position: 'middle'
    });
    toast.present();
  }

  // Disconnect peripheral when leaving the page
  ionViewWillLeave() {
    console.log('ionViewWillLeave disconnecting Bluetooth');
    this.ble.disconnect(this.peripheral.id).then(
      () => console.log('Disconnected ' + JSON.stringify(this.peripheral)),
      () => console.log('ERROR disconnecting ' + JSON.stringify(this.peripheral))
    )
  }

  setStatus(message) {
    console.log(message);
    this.ngZone.run(() => {
      this.statusMessage = message;
    });
  }

  readChar(c) {
    const deviceID = this.peripheral.id;
    const serviceUUID = c.service;
    const charUUID = c.characteristic;
    console.log('readChar', deviceID, serviceUUID, charUUID)

    this.ble.read(deviceID, serviceUUID, charUUID).then(val => {
      const valInString = this.bytesToString(val);
      console.log(valInString, 'have read char');
      this.dialogs.alert(valInString, 'Charateristics Read')
        .then(() => console.log('Dialog dismissed'))
        .catch(e => console.log('Error displaying dialog', e));
    })
  }

  writeChar(c) {
    const deviceID = this.peripheral.id;
    const serviceUUID = c.service;
    const charUUID = c.characteristic;
    console.log('writeChar', deviceID, serviceUUID, charUUID)

    this.dialogs.prompt('Please fill the value', 'Write Charateristics').then(callback => {
      const val = callback.input1;
      if (callback.buttonIndex == 1 && val != '') {
        console.log(callback.buttonIndex, callback.input1, 'writeChar prompt');

        let loader = this.loadingCtrl.create({
          content: "Please wait...",
        });
        loader.present();
        this.ble.write(deviceID, serviceUUID, charUUID, this.stringToBytes(val)).then(r => {
          loader.dismiss();
        });
      }
    })
  }

  // ASCII only
  stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
      array[i] = string.charCodeAt(i);
    }
    return array.buffer;
  }

  // ASCII only
  bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }
}
