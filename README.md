## How The Azure Communication Service works with our FrontEnd.

acs - Azure Communication Services

### What we need.
1. Get `access_token` from the backend. This backend is ours but the token shall also originate from acs (more on that later).  
2. Get the meeting __UUID__ from the backend. This __UUID__ is unique in acs, but we generate it ourselves. It will act as the address of our group call.
3. Get the name user's name. Can be entered at will or from the backend. 

### How it comes together
1. Using the `access_token`, create an object of `AzureCommunicationTokenCredential` that takes the `access_token` as its argument.  
2. Create a `CallClient`.  
3. From the call client create a `CallAgent`, that takes the token_credential and name as arguments.  
4. Get the devices you need to send feed from `device_manager`.
5. Join group call.

```javascript
const token_string = '';
const UUID = '';

const token_credential = new AzureCommunicationTokenCredential(token_string);
const callClient = new CallClient();
const callAgent = await callClient.createCallAgent(token_credential, {
    displayName: 'name_here'
});

const deviceManager = await callClient.getDeviceManager();
const mics = deviceManager.getMicrophones();
const cameras = deviceManager.getCameras();

const call = callAgent.join(UUID);

const others = call.remoteParticipants;

```

## GOOD LUCK UNDERSTANDING
![LOOK HERE FOR SIMPLICITY](https://docs.microsoft.com/en-us/azure/communication-services/media/scenarios/architecture_v2_calling_join_client_driven.svg "Simple Graphic to show the working")