let messagesContainer = document.getElementById("messages");
messagesContainer.scrollTop = messagesContainer.scrollHeight;

const memberContainer = document.getElementById("members__container");
const memberButton = document.getElementById("members__button");

const chatContainer = document.getElementById("messages__container");
const chatButton = document.getElementById("chat__button");

let activeMemberContainer = false;

memberButton.addEventListener("click", () => {
	if (activeMemberContainer) {
		memberContainer.style.display = "none";
	} else {
		memberContainer.style.display = "block";
	}

	activeMemberContainer = !activeMemberContainer;
});

let activeChatContainer = false;

chatButton.addEventListener("click", () => {
	if (activeChatContainer) {
		chatContainer.style.display = "none";
	} else {
		chatContainer.style.display = "block";
	}

	activeChatContainer = !activeChatContainer;
});

//to display any user to the large screen

// main frame
let displayFrame = document.getElementById("stream__box");
// all users video
let videoFrames = document.getElementsByClassName("video__container");
// ID of user in the frame
let userIdInDisplayFrame = null;

let expandVideoFrame = (e) => {
	let child = displayFrame.children[0];

	console.log("got clicked !!!");

	// if already a video is being played in stream then remove and append in normal view
	if (child) {
		document.getElementById("streams__conatiner").appendChild(child);
	}

	// add video being clicked to stream
	displayFrame.style.display = "block";
	displayFrame.appendChild(e.currentTarget);
	userIdInDisplayFrame = e.currentTarget.id;

	// set remmaining users to display small
	for (let i = 0; videoFrames.length > i; i++) {
		if (videoFrames[i].id != userIdInDisplayFrame) {
			videoFrames[i].style.height = "100px";
			videoFrames[i].style.width = "100px";
		}
	}
};

for (let i = 0; videoFrames.length > i; i++) {
	videoFrames[i].addEventListener("click", expandVideoFrame);
}

// to hide the display frame
let hideDisplayFrame = () => {
	userIdInDisplayFrame = null;
	displayFrame.style.display = null;

	let child = displayFrame.children[0];

	document.getElementById("stream__container").appendChild(child);

	for (let i = 0; videoFrames.length > i; i++) {
		videoFrames[i].style.height = "300px";
		videoFrames.style.width = "300px";
	}
};

displayFrame.addEventListener("click", hideDisplayFrame);
