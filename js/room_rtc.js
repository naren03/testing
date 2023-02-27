let APP_ID = "2c8a58c7dadc48068c31966ed96935c2";

//get uid from session storage
// let uid = sessionStorage.getItem("uid");

// if no session then create one
// if (!uid) {
let uid = String(Math.floor(Math.random() * 10000));
// sessionStorage.setItem("uid", uid);
// }

//during production it can be set to a value
let token = null;
let client;

// for chatting

let rtmClient;
let channel;

//getting room from the url
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get("room");

//if no room id then gv a default room id
if (!roomId) {
	window.location = `lobby.html`;
}

// if no display name then redirect to lobby
let displayName = localStorage.getItem("display_name");
if (!displayName) {
	window.location = `lobby.html`;
}

// this gives the local stream
let localTracks = [];
// this is an object having multiple users data
let remoteUsers = {};
// this contains the data of screen share
let localScreenTracks;
let sharingScreen = false;

// when the user joins the room
let joinRoomInit = async () => {
	// init RTM features
	rtmClient = await AgoraRTM.createInstance(APP_ID);
	await rtmClient.login({ uid, token });

	await rtmClient.addOrUpdateLocalUserAttributes({ name: displayName });

	channel = await rtmClient.createChannel(roomId);
	await channel.join();

	channel.on("MemberJoined", handleMemberJoined);
	channel.on("MemberLeft", handleMemberLeft);

	getMembers();

	client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
	await client.join(APP_ID, roomId, token, uid);

	// whenever user publishes
	client.on("user-published", handleUserPublished);
	//whenever user leaves
	client.on("user-left", handleUserLeft);

	// let micro = await client.getMicrophones();

	// call join stream
	joinStream();
};

// get local stream and display
let joinStream = async () => {
	localTracks = await AgoraRTC.createMicrophoneAndCameraTracks(
		{},
		{
			encoderConfig: {
				width: { min: 640, ideal: 1920, max: 1920 },
				height: { min: 480, ideal: 1080, max: 1080 },
			},
		},
	);

	let player = `<div id="user-container-${uid}" class="video__container">
                    <div class="video-player" id="user-${uid}></div>
                </div>`;

	document
		.getElementById("streams__container")
		.insertAdjacentHTML("beforeend", player);

	document
		.getElementById(`user-container-${uid}`)
		.addEventListener("click", expandVideoFrame);
	// 0-audio and 1-video
	localTracks[1].play(`user-container-${uid}`);

	await client.publish([localTracks[0], localTracks[1]]);
};

// switch to camera from screen share

let switchToCamera = async () => {
	let player = `<div id="user-container-${uid}" class="video__container">
                    <div class="video-player" id="user-${uid}></div>
                </div>`;

	displayFrame.insertAdjacentHTML("beforeend", player);

	await localTracks[0].setMuted(true);
	await localTracks[1].setMuted(true);

	document.getElementById("mic-btn").classList.remove("active");
	document.getElementById("screen-btn").classList.remove("active");

	localTracks[1].play(`user-${uid}`);
	await client.publish([localTracks[1]]);
};
// handle user publish
let handleUserPublished = async (user, mediaType) => {
	// collection of all remote users
	remoteUsers[user.uid] = user;

	await client.subscribe(user, mediaType);

	let player = document.getElementById(`user-container-${user.uid}`);

	if (player === null) {
		player = `<div id="user-container-${user.uid}" class="video__container">
                    <div class="video-player" id="user-${user.uid}></div>
                </div>`;

		document
			.getElementById("streams__container")
			.insertAdjacentHTML("beforeend", player);
		document
			.getElementById(`user-container-${user.uid}`)
			.addEventListener("click", expandVideoFrame);
	}

	// if someone is in the big screen then new joined user will be displayed in small form

	if (displayFrame.style.display) {
		player.style.height = "100px";
		player.style.width = "100px";
	}
	console.log("NEW USER JOINED:", user);
	if (mediaType === "video") {
		user.videoTrack.play(`user-container-${user.uid}`);
	}
};

// handle user left
let handleUserLeft = async (user) => {
	delete remoteUsers[user.uid];

	// removing from dom
	document.getElementById(`user-container-${user.uid}`).remove();

	// if the user was in screen
	if (userIdInDisplayFrame === `user-conatiner-${user.uid}`) {
		displayFrame.style.display = null;

		let videoFrames = document.getElementsByClassName("video__container");

		for (let i = 0; videoFrames.length > i; i++) {
			videoFrames[i].style.height = "300px";
			videoFrames[i].style.width = "300px";
		}
	}
};

// toggling the camera

let toggleCamera = async (e) => {
	let button = e.currentTarget;

	if (localTracks[1].muted) {
		await localTracks[1].setMuted(false);
		button.classList.add("active");
	} else {
		await localTracks[1].setMuted(true);
		button.classList.remove("active");
	}
};
// toggling the mic

let toggleMic = async (e) => {
	let button = e.currentTarget;

	if (localTracks[0].muted) {
		await localTracks[0].setMuted(false);
		button.classList.add("active");
	} else {
		await localTracks[0].setMuted(true);
		button.classList.remove("active");
	}
};

// toggling screen

let toggleScreen = async (e) => {
	let screenButton = e.currentTarget;
	let cameraButton = document.getElementById("camera-btn");

	if (!sharingScreen) {
		sharingScreen = true;

		screenButton.classList.add("active");
		cameraButton.classList.remove("active");
		cameraButton.style.display = "none";

		localScreenTracks = await AgoraRTC.createScreenVideoTrack();

		document.getElementById(`user-container-${uid}`).remove();
		displayFrame.style.display = "block";

		let player = `<div id="user-container-${uid}" class="video__container">
                    <div class="video-player" id="user-${uid}></div>
                </div>`;

		displayFrame.insertAdjacentHTML("beforeend", player);
		document
			.getElementById(`user-container-${uid}`)
			.addEventListener("click", expandVideoFrame);

		userIdInDisplayFrame = `user-container-${uid}`;
		localScreenTracks.play(`user-${uid}`);

		// remove local camera feed
		await client.unpublish([localTracks[1]]);
		await client.publish([localScreenTracks]);

		let videoFrames = document.getElementsByClassName("video__container");

		for (let i = 0; videoFrames.length > i; i++) {
			if (videoFrames[i].id != userIdInDisplayFrame) {
				videoFrames[i].style.height = "100px";
				videoFrames[i].style.width = "100px";
			}
		}
	} else {
		sharingScreen = false;
		cameraButton.style.display = "block";
		document.getElementById(`user-container-${uid}`).remove();
		await client.unpublish([localScreenTracks]);

		switchToCamera();
	}
};

document.getElementById("mic-btn").addEventListener("click", toggleMic);

document.getElementById("camera-btn").addEventListener("click", toggleCamera);

document.getElementById("screen-btn").addEventListener("click", toggleScreen);
//execution strts here
joinRoomInit();
