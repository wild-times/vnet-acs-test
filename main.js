import { CallClient, LocalVideoStream, VideoStreamRenderer } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

import './style.css';

const callForm = document.forms['call-form'];

// handle group calling
async function callFormHandler (callEvent) {
    callEvent.preventDefault();

    // get data
    const form_ = new FormData(callEvent.target);
    const userAccessToken = form_.get('access-token');
    const groupId = form_.get('group-id');
    const userDisplayName = form_.get('call-name');

    if (userAccessToken && typeof userAccessToken === 'string' && groupId && typeof groupId === 'string' && userDisplayName && typeof userDisplayName === 'string') {
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

                wildButton.addEventListener('click', (wildEvent_) => {
                    wildEvent_.preventDefault();
                    call.hangUp();
                });

                call.on("stateChanged", () => {
                    document.getElementById('wt').innerText = call.state;
                });

                // participants now
                call.on('remoteParticipantsUpdated', ({added, removed}) => {
                    if (added.length || removed.length) {
                        document.getElementById('remotes').innerHTML = '';
                        call.remoteParticipants.forEach((part) => addRemoteParticipantToPage(part));
                    };
                });
            })

        } else {
            document.getElementById('me').innerHTML = "<h1>Permissions DENIED!</h1>"
        }
    }

}


async function addRemoteParticipantToPage (remoteParticipant, ret = 2) {
    const videoStream = await remoteParticipant.videoStreams[0];
    let view;

    // create a to store the video
    const rd = document.createElement('div');
    const nameD = document.createElement('span');

    // renderer
    const rdRdr = new VideoStreamRenderer(videoStream);

    // create the view and save it
    const viewCreation = async () => {

        view = await rdRdr.createView();
        nameD.innerText = await remoteParticipant.displayName;
        rd.appendChild(view.target);
        rd.appendChild(nameD);
        rd.id = await remoteParticipant.identifier.communicationUserId;
        document.getElementById('remotes').appendChild(rd);
    };

    // remoteVideoStream.isAvailable
    videoStream.on('isAvailableChanged', async () => {
        if (videoStream.isAvailable) {
            await viewCreation();
        }
    });

    if (videoStream.isAvailable) {
        try {
            await viewCreation();
        } catch (e) {
            console.error(e, ">>>");
        }
    } else {
        if (ret > 0) {
            await addRemoteParticipantToPage(remoteParticipant, ret--);
        }
    }
}

if (callForm) {
    callForm.addEventListener('submit', callFormHandler);
}
