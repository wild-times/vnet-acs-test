import { CallClient, LocalVideoStream, VideoStreamRenderer } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

import './style.css';

const forms = document.forms;

// start a call here
const startCallForm = forms['start-call-form'];

async function startCallHandler (event_) {
    event_.preventDefault();

    // get data
    const form_ = new FormData(event_.target);
    const userAccessToken = form_.get('access-token');
    const userDisplayName = form_.get('name-start');

    // start call now
    if (userAccessToken && userDisplayName && typeof userAccessToken === 'string' && typeof userDisplayName === 'string') {
        // initialize objects/call client and token credential
        const callClient = new CallClient();
        const tokenCredential = new AzureCommunicationTokenCredential(userAccessToken);
        const callAgent = await callClient.createCallAgent(tokenCredential, {
            displayName: userDisplayName
        });

        // devices now
        const deviceManager = await callClient.getDeviceManager();
        // ask permissions first
        const devicesPermissions = await deviceManager.askDevicePermission({
            audio: true,
            video: true
        });

        // continue if permissions granted
        if (devicesPermissions.audio && devicesPermissions.video) {
            // choose devices

            // camera
            const cameras = await deviceManager.getCameras();
            const ccc = cameras.map((c, i) => [c.name, i]).map((c) => `<option value="${c[1]}">${c[0]}</option>`);
            const cameraSelect = document.getElementById('cameras-x');
            cameraSelect.innerHTML = ccc.reduce((a, b) => a + b);

            // mic
            const mics = await deviceManager.getMicrophones();
            const mmm = mics.map((m, i) => [m.name, i]).map((m) => `<option value="${m[1]}">${m[0]}</option>`);
            const micSelect = document.getElementById('mic-x');
            micSelect.innerHTML = mmm.reduce((a, b) => a + b);

            // display local stream
            const localVideoStream = new LocalVideoStream(cameras[0]);
            const vidStrRend = new VideoStreamRenderer(localVideoStream);
            const view = await vidStrRend.createView();
            document.getElementById('me').appendChild(view.target);
            document.getElementById('call-bro').style.display = 'block';

            // update mics?
            const micUpdateX = async (micSelectEvent_) => {
                micSelectEvent_.preventDefault();
                await deviceManager.selectMicrophone(mics[micSelectEvent_.target.value]);
            };

            micSelect.addEventListener('change', micUpdateX);

            // update cameras
            cameraSelect.addEventListener('change', (cameraSelectEvent_) => {
                cameraSelectEvent_.preventDefault();
                localVideoStream.switchSource(cameras[cameraSelectEvent_.target.value]);
            });

            // start a group call and save ID
            const commenceButton = document.getElementById('cm');
            const wildButton = document.getElementById('wd');
            commenceButton.addEventListener('click', (cmEvent_) => {
                cmEvent_.preventDefault();
                wildButton.innerText = 'TO END CALL';

                // making the call
                const placeCallOptions = {
                    videoOptions: {localVideoStreams: [localVideoStream]}
                };
                // const call = callAgent.startCall([{id: '8:echo123'}], placeCallOptions);
                const call = callAgent.startCall([], placeCallOptions);

                console.log(call);

                wildButton.addEventListener('click', (wildEvent_) => {
                    wildEvent_.preventDefault();
                    call.hangUp({forEveryone: true})
                });

                call.on("stateChanged", () => {
                    document.getElementById('wt').innerText = call.state;
                });

            })

        } else {
            document.getElementById('me').innerHTML = "<h1>Permissions DENIED!</h1>"
        }


    }
}

if (startCallForm) {
    startCallForm.addEventListener('submit', startCallHandler);
}


// join group call here
const joinCallForm = forms['join-call-form'];

async function joinCallHandler (joinCallEvent) {
    joinCallEvent.preventDefault();

    // get data
    const form_ = new FormData(joinCallEvent.target);
    const identity = form_.get('your-identity');
    const userAccessToken = form_.get('access-token-group');
    const groupId = form_.get('group-id');
    const userDisplayName = form_.get('your-name');

    if (identity && typeof identity === 'string' && userAccessToken && typeof userAccessToken === 'string' && groupId && typeof groupId === 'string' && userDisplayName && typeof userDisplayName === 'string') {
        // initialize objects/call client and token credential
        const callClient = new CallClient();
        const tokenCredential = new AzureCommunicationTokenCredential(userAccessToken);
        const callAgent = await callClient.createCallAgent(tokenCredential, {
            displayName: userDisplayName
        });


        // devices now
        const deviceManager = await callClient.getDeviceManager();
        // ask permissions first
        const devicesPermissions = await deviceManager.askDevicePermission({
            audio: true,
            video: true
        });

        // continue if permissions granted
        if (devicesPermissions.audio && devicesPermissions.video) {
            // choose devices

            // camera
            const cameras = await deviceManager.getCameras();
            const ccc = cameras.map((c, i) => [c.name, i]).map((c) => `<option value="${c[1]}">${c[0]}</option>`);
            const cameraSelect = document.getElementById('cameras-x');
            cameraSelect.innerHTML = ccc.reduce((a, b) => a + b);

            // mic
            const mics = await deviceManager.getMicrophones();
            const mmm = mics.map((m, i) => [m.name, i]).map((m) => `<option value="${m[1]}">${m[0]}</option>`);
            const micSelect = document.getElementById('mic-x');
            micSelect.innerHTML = mmm.reduce((a, b) => a + b);

            // display local stream
            const localVideoStream = new LocalVideoStream(cameras[0]);
            const vidStrRend = new VideoStreamRenderer(localVideoStream);
            const view = await vidStrRend.createView();
            document.getElementById('me').appendChild(view.target);
            document.getElementById('call-bro').style.display = 'block';

            // update mics?
            const micUpdateX = async (micSelectEvent_) => {
                micSelectEvent_.preventDefault();
                await deviceManager.selectMicrophone(mics[micSelectEvent_.target.value]);
            };

            micSelect.addEventListener('change', micUpdateX);

            // update cameras
            cameraSelect.addEventListener('change', (cameraSelectEvent_) => {
                cameraSelectEvent_.preventDefault();
                localVideoStream.switchSource(cameras[cameraSelectEvent_.target.value]);
            });

            // join a group call
            const commenceButton = document.getElementById('cm');
            const wildButton = document.getElementById('wd');
            commenceButton.addEventListener('click', (cmEvent_) => {
                cmEvent_.preventDefault();
                wildButton.innerText = 'TO LEAVE CALL';

                // making the call
                const placeCallOptions = {
                    videoOptions: {localVideoStreams: [localVideoStream]}
                };

                // join group call
                const call = callAgent.join({groupId: groupId}, placeCallOptions);

                console.log(call);

                wildButton.addEventListener('click', (wildEvent_) => {
                    wildEvent_.preventDefault();
                    call.hangUp({forEveryone: false})
                });

                call.on("stateChanged", () => {
                    document.getElementById('wt').innerText = call.state;
                });

            })

        } else {
            document.getElementById('me').innerHTML = "<h1>Permissions DENIED!</h1>"
        }
    }

}

if (joinCallForm) {
    joinCallForm.addEventListener('submit', joinCallHandler);
}

























