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
//getting room from the url
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get("room");

//if no room id then gv a default room id
if (!roomId) {
	roomId = "main";
}

// this gives the local stream
let localTracks = [];
// this is an object having multiple users data
let remoteUsers = {};

// when the user joins the room
let joinRoomInit = async () => {
	client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
	await client.join(APP_ID, roomId, token, uid);

	// whenever user publishes
	client.on("user-published", handleUserPublished);
	//whenever user leaves
	client.on("user-left", handleUserLeft);

	// call join stream
	joinStream();
};

// get local stream and display
let joinStream = async () => {
	localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

	let player = `<div id="user-container-${uid}" class="video__container">
                    <div class="video-player" id="user-${uid}></div>
                </div>`;

	document
		.getElementById("streams__container")
		.insertAdjacentHTML("beforeend", player);

	// 0-audio and 1-video
	localTracks[1].play(`user-container-${uid}`);

	await client.publish([localTracks[0], localTracks[1]]);
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
	}
	console.log("user:", user);
	if (mediaType === "video") {
		user.videoTrack.play(`user-container-${user.uid}`);
	}
};

// handle user left
let handleUserLeft = async (user) => {
	delete remoteUsers[user.uid];

	document.getElementById(`user-container-${user.uid}`).remove();
};

//execution strts here
joinRoomInit();
