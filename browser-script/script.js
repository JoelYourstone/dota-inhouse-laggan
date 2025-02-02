function getChannelContainer(username) {
  // Evaluate the XPath expression.
  var result = document.evaluate(
    `//div[contains(text(), '${username}')]`,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );

  // Get the first matching element.
  var element = result.singleNodeValue;

  var channelContainer =
    element.parentElement.parentElement.parentElement.parentElement
      .parentElement.parentElement;

  return channelContainer;
}

function observeClassChange(targetElement, callback) {
  if (!(targetElement instanceof Element)) {
    throw new Error("The first argument must be a valid DOM Element.");
  }
  if (typeof callback !== "function") {
    throw new Error("The second argument must be a callback function.");
  }

  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      console.log(mutation);
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        // Use classList to get an array of classes
        const classes = Array.from(targetElement.classList);
        callback(classes);
      }
    }
  });

  observer.observe(targetElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return observer;
}

function populatePlayers() {
  console.log("1. populatePlayers");
  // If any element has been unmounted, we need to re-populate the players
  let channelContainer;
  for (const player of players) {
    if (!player.element.isConnected) {
      console.log("2. A player has been unmounted");
      channelContainer = getChannelContainer("Becca");
      addPlayers(channelContainer);
      return;
    }
  }

  channelContainer = getChannelContainer("Becca");
  const playerChildNodes = [...channelContainer.childNodes];
  const numberOfPlayers = playerChildNodes.length;

  if (players.length === numberOfPlayers) {
    return;
  }

  addPlayers(channelContainer);
}

function addPlayers(channelContainer) {
  // Remove all existing players
  players.forEach((player) => {
    player.observer.disconnect();
    player.targetElement?.remove();
  });

  players = [];
  const canvas = document.getElementById(canvasId);
  [...channelContainer.childNodes].forEach((player) => {
    const targetElement = document.createElement("div");
    canvas.appendChild(targetElement);

    const playerName =
      player.childNodes[0].childNodes[0].childNodes[1].innerText.trim();

    players.push({
      name: playerName,
      element: player.childNodes[0].childNodes[0].childNodes[0],
      observer: observeClassChange(
        player.childNodes[0].childNodes[0].childNodes[0],
        (currentClasses) => {
          const isSpeaking = currentClasses.some((c) =>
            c.startsWith("avatarSpeaking")
          );
          targetElement.innerText = isSpeaking
            ? `${playerName} SPEAKING`
            : playerName;
        }
      ),
      targetElement: targetElement,
    });
  });

  console.log("Players recreated  ", players);
}

const styleId = "style-element-to-add-full-transparency";

function removeFullTransparency() {
  const existingStyleElement = document.getElementById(styleId);
  if (existingStyleElement) {
    existingStyleElement.remove();
  }
}

function addFullTransparency() {
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    #app-mount * {
      opacity: 0;
    }

    * {
    background-color: rgba(0, 0, 0, 0);
    }
  `;
  document.head.appendChild(style);
}

const canvasId = "my-canvas";
function createMyCanvas() {
  const canvas = document.getElementById(canvasId);
  if (canvas) {
    canvas.remove();
  }

  const newCanvas = document.createElement("div");
  newCanvas.id = canvasId;
  newCanvas.style.position = "absolute";
  newCanvas.style.top = "0";
  newCanvas.style.left = "0";
  newCanvas.style.width = "100%";
  newCanvas.style.height = "100%";
  newCanvas.style.backgroundColor = "rgba(0, 0, 0, 0)";
  document.body.appendChild(newCanvas);
}

createMyCanvas();

let players = [];
setInterval(() => {
  populatePlayers();
}, 1000);
