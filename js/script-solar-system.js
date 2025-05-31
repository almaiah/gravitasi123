
      import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js';
      import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/controls/OrbitControls.js';
      import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/loaders/GLTFLoader.js';
      import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/postprocessing/EffectComposer.js';
      import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/postprocessing/RenderPass.js';
      import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/postprocessing/UnrealBloomPass.js';
      import { EXRLoader } from 'https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/loaders/EXRLoader.js';

      // Global scene variables
      let scene, camera, renderer, controls, composer;
      const planetsGlobal = {};
      let selectedPlanetKey = null;
      let asteroidBelt;
      const clickableObjects = [];
      const asteroidModels = [];
      let totalAsteroids = 1;
      const asteroidPaths = [
        "mesh/asteroid.glb",
        "mesh/asteroid2.glb",
        "mesh/asteroid3.glb",
        "mesh/asteroid4.glb"
      ];

      // Scaling constants
      const REVOLUTION_SCALE = 1;
      const ROTATION_SCALE = 10;
      const ORBITAL_MULTIPLIER = 10;
      const ROTATION_MULTIPLIER = 3;

      // Model data
      const models = {
        sun: 'mesh/sun.glb',
        mercury: 'mesh/mercury.glb',
        venus: 'mesh/venus.glb',
        earth: 'mesh/earth.glb',
        mars: 'mesh/mars.glb',
        jupiter: 'mesh/jupiter.glb',
        saturn: 'mesh/saturn.glb',
        uranus: 'mesh/uranus.glb',
        neptune: 'mesh/neptune.glb'
      };

      const planetData = {
        mercury: { name: "Mercury", semiMajorAxis: 0.39, eccentricity: 0.206, orbitalPeriod: 88, rotationPeriod: 58.6, description: "Mercury is the smallest and innermost planet.", color: "#b1b1b1" },
        venus:   { name: "Venus", semiMajorAxis: 0.72, eccentricity: 0.007, orbitalPeriod: 225, rotationPeriod: -243, description: "Venus has a runaway greenhouse effect.", color: "#f5deb3" },
        earth:   { name: "Earth", semiMajorAxis: 1.00, eccentricity: 0.017, orbitalPeriod: 365.25, rotationPeriod: 1, description: "Earth supports life with abundant water.", color: "#2a8fbd" },
        mars:    { name: "Mars", semiMajorAxis: 1.52, eccentricity: 0.093, orbitalPeriod: 687, rotationPeriod: 1.03, description: "Mars is the Red Planet.", color: "#d14b28" },
        jupiter: { name: "Jupiter", semiMajorAxis: 5.20, eccentricity: 0.048, orbitalPeriod: 4333, rotationPeriod: 0.41, description: "Jupiter is a gas giant.", color: "#d2b48c" },
        saturn:  { name: "Saturn", semiMajorAxis: 9.58, eccentricity: 0.056, orbitalPeriod: 10759, rotationPeriod: 0.45, description: "Saturn is known for its rings.", color: "#f4a460" },
        uranus:  { name: "Uranus", semiMajorAxis: 19.22, eccentricity: 0.046, orbitalPeriod: 30687, rotationPeriod: -0.72, description: "Uranus rotates sideways.", color: "#7fffd4" },
        neptune: { name: "Neptune", semiMajorAxis: 30.05, eccentricity: 0.010, orbitalPeriod: 60190, rotationPeriod: 0.67, description: "Neptune is a deep blue ice giant.", color: "#4169e1" }
      };

      const sunData = { name: "sun", description: "The Sun powers our solar system.", color: "#ffcc00" };

      // Moons data
      const moonsData = {
        earth: [
          { name: "moon", orbitRadius: 8, orbitSpeed: 1.022, scale: 0.2, description: "Earth's Moon influences tides." }
        ],
        mars: [
          { name: "phobos", orbitRadius: 8, orbitSpeed: 2.138, scale: 0.015, description: "Phobos is Mars' larger moon." },
          { name: "deimos", orbitRadius: 10, orbitSpeed: 1.351, scale: 0.015, description: "Deimos is Mars' smaller moon." }
        ],
        jupiter: [
          { name: "io", orbitRadius: 12, orbitSpeed: 17.33, scale: 0.001, description: "Io is volcanically active." },
          { name: "europa", orbitRadius: 16, orbitSpeed: 13.74, scale: 0.001, description: "Europa may hide a subsurface ocean." },
          { name: "ganymede", orbitRadius: 20, orbitSpeed: 10.88, scale: 0.001, description: "Ganymede is the largest moon." },
          { name: "callisto", orbitRadius: 24, orbitSpeed: 8.20, scale: 0.001, description: "Callisto is heavily cratered." }
        ],
        saturn: [
          { name: "titan", orbitRadius: 18, orbitSpeed: 5.57, scale: 0.0005, description: "Titan has a thick atmosphere." },
          { name: "rhea", orbitRadius: 22, orbitSpeed: 4.52, scale: 0.0005, description: "Rhea is a mid-sized, cratered moon." }
        ],
        uranus: [
          { name: "titania", orbitRadius: 18, orbitSpeed: 4.37, scale: 0.0007, description: "Titania features deep canyons." },
          { name: "oberon", orbitRadius: 22, orbitSpeed: 3.76, scale: 0.0007, description: "Oberon is heavily cratered." }
        ],
        neptune: [
          { name: "triton", orbitRadius: 16, orbitSpeed: 4.39, scale: 0.001, description: "Triton has a retrograde orbit and geysers." }
        ]
      };

      const DEFAULT_TIME_SCALE = 1;
      const DEFAULT_ECCENTRICITY = 0.2;
      const DEFAULT_SEMI_MAJOR_MULTIPLIER = 1;
      const beltInnerRadius = 100;
      const beltOuterRadius = 150;

      const gltfLoader = new GLTFLoader();

      function preloadAsteroids(callback) {
        let loaded = 0;
        asteroidPaths.forEach(path => {
          gltfLoader.load(path, function(gltf) {
            asteroidModels.push(gltf.scene);
            loaded++;
            if (loaded === asteroidPaths.length) {
              callback();
            }
          });
        });
      }

      function createAsteroidBelt() {
        const group = new THREE.Group();
        const countPerModel = Math.floor(totalAsteroids / asteroidModels.length);
        asteroidModels.forEach(model => {
          let baseMesh;
          model.traverse(child => {
            if (child.isMesh && !baseMesh) baseMesh = child;
          });
          if (!baseMesh) return;
          const geometry = baseMesh.geometry;
          const material = baseMesh.material.clone();
          material.frustumCulled = false;
          const instancedMesh = new THREE.InstancedMesh(geometry, material, countPerModel);
          instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          const dummy = new THREE.Object3D();
          for (let i = 0; i < countPerModel; i++) {
            const theta = Math.random() * Math.PI * 2;
            const radius =
              beltInnerRadius + Math.random() * (beltOuterRadius - beltInnerRadius);
            dummy.position.set(
              radius * Math.cos(theta),
              (Math.random() - 0.5) * 2,
              radius * Math.sin(theta)
            );
            const scale = 0.002;
            dummy.scale.set(scale, scale, scale);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
          }
          instancedMesh.instanceMatrix.needsUpdate = true;
          instancedMesh.userData = { type: "asteroid" };
          group.add(instancedMesh);
        });
        scene.add(group);
        asteroidBelt = group;
      }

      // Global: planet follow flag
      let followPlanetKey = null;

      // Create a clock for delta time
      const clock = new THREE.Clock();

      // New variables for smooth right-click pan
      let isRightMouseDown = false;
      const panVelocity = new THREE.Vector2(0, 0);
      const panDamping = 0.9;
      const panAcceleration = 0.5;

      // Helper function to update the visibility of mobile buttons (Gyroscope, Performance, Toggle Controls)
      function updateMobileButtonsVisibility() {
        const controlsPanel = document.getElementById("controls");
        const infoPanel = document.getElementById("info-panel");
        const performanceToggle = document.getElementById("performance-toggle");
        const orientationToggle = document.getElementById("orientation-toggle");
        const toggleControls = document.getElementById("toggle-controls");
        const lessonsVisible = document.getElementById("kepler-laws").style.display !== "none";
        if (lessonsVisible) {
          if (performanceToggle) performanceToggle.style.display = "none";
          if (orientationToggle) orientationToggle.style.display = "none";
          if (toggleControls) toggleControls.style.display = "none";
        } else {
          if (
            (controlsPanel && controlsPanel.style.display !== "none") ||
            (infoPanel && infoPanel.classList.contains("active"))
          ) {
            if (performanceToggle) performanceToggle.style.display = "none";
            if (orientationToggle) orientationToggle.style.display = "none";
          } else {
            if (performanceToggle) performanceToggle.style.display = "block";
            if (orientationToggle) orientationToggle.style.display = "block";
          }
          // Also ensure that the toggle controls button shows on mobile when controls are hidden
          if (window.innerWidth < 768 && controlsPanel.style.display === "none") {
            if (toggleControls) toggleControls.style.display = "block";
          }
        }
      }

      function initSolarSystem() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          10000
        );
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById("solar-system").appendChild(renderer.domElement);

        // OrbitControls for rotation
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
        controls.rotateSpeed = 1.0;
        controls.minDistance = 1;
        controls.maxDistance = 10000;
        if ("ontouchstart" in window) {
          controls.enableZoom = false;
          controls.enableRotate = false;
        }

        camera.position.set(0, 50, 100);
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const bloomParams = {
          exposure: 1,
          bloomStrength: 1.5,
          bloomThreshold: 0.2,
          bloomRadius: 0.4
        };
        const bloomPass = new UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          bloomParams.bloomStrength,
          bloomParams.bloomRadius,
          bloomParams.bloomThreshold
        );
        composer.addPass(bloomPass);
        scene.add(new THREE.AmbientLight(0x404040));
        const sunLight = new THREE.PointLight(0xffffff, 1000, 500);
        scene.add(sunLight);
        new EXRLoader().load("mesh/Background.exr", function (texture) {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          texture.encoding = THREE.LinearEncoding;
          scene.background = texture;
        });

        gltfLoader.load(models.sun, function (gltf) {
          const sun = gltf.scene;
          sun.scale.set(0.75, 0.75, 0.75);
          sun.traverse(child => {
            if (child.isMesh) {
              child.userData = { ...child.userData, type: "sun" };
              child.matrixAutoUpdate = false;
              clickableObjects.push(child);
            }
          });
          sun.add(sunLight);
          scene.add(sun);
        });

        const orbitScale = 50;
        Object.entries(planetData).forEach(([key, planet]) => {
          gltfLoader.load(models[key], function (gltf) {
            const planetModel = gltf.scene;
            const angle = Math.random() * Math.PI * 2;
            const globalMultiplier = parseFloat(
              document.getElementById("semi-major").value
            );
            const a =
              planet.semiMajorAxis *
              (planet.semiMajorMultiplier || 1) *
              globalMultiplier *
              orbitScale;
            const ecc = planet.eccentricity;
            planetModel.position.x = a * (Math.cos(angle) - ecc);
            planetModel.position.z =
              (a * Math.sqrt(1 - ecc * ecc)) * Math.sin(angle);
            planetModel.traverse(child => {
              if (child.isMesh) {
                child.frustumCulled = true;
                child.matrixAutoUpdate = false;
                child.userData = { ...child.userData, type: "planet", key: key };
                clickableObjects.push(child);
              }
            });
            scene.add(planetModel);
            const orbitPoints = [];
            for (let i = 0; i <= 100; i++) {
              const theta = (i / 100) * Math.PI * 2;
              orbitPoints.push(
                a * (Math.cos(theta) - ecc),
                0,
                (a * Math.sqrt(1 - ecc * ecc)) * Math.sin(theta)
              );
            }
            const orbitGeometry = new THREE.BufferGeometry();
            orbitGeometry.setAttribute(
              "position",
              new THREE.Float32BufferAttribute(orbitPoints, 3)
            );
            const orbitLine = new THREE.Line(
              orbitGeometry,
              new THREE.LineBasicMaterial({ color: 0x444444 })
            );
            orbitLine.frustumCulled = true;
            orbitLine.matrixAutoUpdate = false;
            scene.add(orbitLine);
            planetsGlobal[key] = {
              mesh: planetModel,
              angle: angle,
              data: { ...planet, semiMajorMultiplier: 1 },
              orbitLine: orbitLine,
              moons: []
            };

            if (moonsData[key]) {
              moonsData[key].forEach(mData => {
                gltfLoader.load(`mesh/${mData.name}.glb`, function (gltf) {
                  const moonModel = gltf.scene;
                  moonModel.name = "moon_" + mData.name;
                  moonModel.userData = {
                    type: "moon",
                    parent: key,
                    name: mData.name,
                    description: mData.description
                  };
                  moonModel.scale.set(
                    mData.scale || 1,
                    mData.scale || 1,
                    mData.scale || 1
                  );
                  moonModel.updateMatrix();
                  const orbitRadius = mData.orbitRadius;
                  const mAngle = Math.random() * Math.PI * 2;
                  moonModel.position.set(
                    Math.cos(mAngle) * orbitRadius,
                    0,
                    Math.sin(mAngle) * orbitRadius
                  );
                  moonModel.traverse(child => {
                    if (child.isMesh) {
                      child.userData = moonModel.userData;
                      child.frustumCulled = true;
                      clickableObjects.push(child);
                    }
                  });
                  planetModel.add(moonModel);
                  const segments = 64;
                  const moonOrbitPoints = [];
                  for (let i = 0; i <= segments; i++) {
                    const theta = (i / segments) * Math.PI * 2;
                    moonOrbitPoints.push(
                      Math.cos(theta) * orbitRadius,
                      0,
                      Math.sin(theta) * orbitRadius
                    );
                  }
                  const moonOrbitGeometry = new THREE.BufferGeometry();
                  moonOrbitGeometry.setAttribute(
                    "position",
                    new THREE.Float32BufferAttribute(moonOrbitPoints, 3)
                  );
                  const moonOrbitLine = new THREE.Line(
                    moonOrbitGeometry,
                    new THREE.LineBasicMaterial({ color: 0x888888 })
                  );
                  moonOrbitLine.frustumCulled = true;
                  moonOrbitLine.matrixAutoUpdate = false;
                  planetModel.add(moonOrbitLine);
                  planetsGlobal[key].moons.push({
                    mesh: moonModel,
                    orbitRadius: orbitRadius,
                    angle: mAngle,
                    orbitSpeed: mData.orbitSpeed,
                    orbitLine: moonOrbitLine
                  });
                });
              });
            }
          });
        });
        createAsteroidBelt();
        window.addEventListener("resize", function () {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
          composer.setSize(window.innerWidth, window.innerHeight);
        });

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        function detectInteraction(clientX, clientY) {
          pointer.x = (clientX / window.innerWidth) * 2 - 1;
          pointer.y = -(clientY / window.innerHeight) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          const intersects = raycaster.intersectObjects(clickableObjects, true);
          if (intersects.length > 0) {
            const data = intersects[0].object.userData;
            if (data && data.type && data.type !== "asteroid") {
              showObjectInfo(data);
            }
          }
        }
        document.getElementById("solar-system").addEventListener("click", function (event) {
          detectInteraction(event.clientX, event.clientY);
        });

        // --- DOUBLE LEFT CLICK TELEPORT ---
        renderer.domElement.addEventListener("dblclick", function (event) {
          event.preventDefault();
          pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
          pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          const newPos = new THREE.Vector3();
          newPos.copy(raycaster.ray.origin).add(
            raycaster.ray.direction.clone().multiplyScalar(100)
          );
          camera.position.copy(newPos);
          controls.target.copy(newPos);
        });

        // --- CUSTOM SMOOTH MOUSE PAN (right–click) ---
        renderer.domElement.addEventListener("mousedown", function (event) {
          if (event.button === 2) {
            isRightMouseDown = true;
          }
        });
        window.addEventListener("mousemove", function (event) {
          if (isRightMouseDown) {
            const deltaX =
              event.movementX ||
              event.mozMovementX ||
              event.webkitMovementX ||
              0;
            const deltaY =
              event.movementY ||
              event.mozMovementY ||
              event.webkitMovementY ||
              0;
            panVelocity.x += deltaX * panAcceleration;
            panVelocity.y += deltaY * panAcceleration;
          }
        });
        window.addEventListener("mouseup", function (event) {
          if (event.button === 2) {
            isRightMouseDown = false;
          }
        });
        renderer.domElement.addEventListener("contextmenu", function (event) {
          event.preventDefault();
        });
        // --- END CUSTOM SMOOTH MOUSE PAN ---

        // --- SCROLL WHEEL ZOOM AT CONSTANT SPEED ---
        renderer.domElement.addEventListener(
          "wheel",
          function (event) {
            event.preventDefault();
            const zoomSpeed = 5;
            if (event.deltaY < 0) {
              camera.position.z = Math.max(
                controls.minDistance,
                camera.position.z - zoomSpeed
              );
            } else {
              camera.position.z = Math.min(
                controls.maxDistance,
                camera.position.z + zoomSpeed
              );
            }
          },
          { passive: false }
        );

        // MOBILE TOUCH CONTROLS
        const mobilePanSpeed = 0.2;
        const solarSystemElem = document.getElementById("solar-system");
        let touchStartTime = 0,
          isTouching = false,
          lastTouchX = 0,
          lastTouchY = 0,
          lastTouchDistance = null,
          touchMoveCount = 0;
        solarSystemElem.addEventListener(
          "touchstart",
          function (event) {
            touchStartTime = Date.now();
            touchMoveCount = 0;
            if (event.touches.length === 1) {
              isTouching = true;
              lastTouchX = event.touches[0].clientX;
              lastTouchY = event.touches[0].clientY;
            } else if (event.touches.length === 2) {
              isTouching = false;
              lastTouchDistance = getDistance(
                event.touches[0],
                event.touches[1]
              );
            }
            event.preventDefault();
          },
          { passive: false }
        );
        solarSystemElem.addEventListener(
          "touchmove",
          function (event) {
            touchMoveCount++;
            if (event.touches.length === 1 && isTouching) {
              const touch = event.touches[0];
              const dx = touch.clientX - lastTouchX;
              const dy = touch.clientY - lastTouchY;
              const panOffset = new THREE.Vector3();
              const right = new THREE.Vector3();
              camera.getWorldDirection(panOffset);
              right.crossVectors(camera.up, panOffset).normalize();
              right.multiplyScalar(dx * mobilePanSpeed);
              const forward = new THREE.Vector3();
              camera.getWorldDirection(forward)
                .normalize()
                .multiplyScalar(-dy * mobilePanSpeed);
              camera.position.add(right).add(forward);
              controls.target.add(right).add(forward);
              lastTouchX = touch.clientX;
              lastTouchY = touch.clientY;
            } else if (event.touches.length === 2) {
              const currentDistance = getDistance(
                event.touches[0],
                event.touches[1]
              );
              if (lastTouchDistance) {
                const scale = currentDistance / lastTouchDistance;
                let newZ = camera.position.z / scale;
                newZ = Math.max(
                  controls.minDistance,
                  Math.min(controls.maxDistance, newZ)
                );
                camera.position.z = newZ;
              }
              lastTouchDistance = currentDistance;
            }
            event.preventDefault();
          },
          { passive: false }
        );
        solarSystemElem.addEventListener(
          "touchend",
          function (event) {
            const touchDuration = Date.now() - touchStartTime;
            if (event.touches.length === 0) {
              if (touchDuration < 300 && touchMoveCount < 5) {
                const touch = event.changedTouches[0];
                detectInteraction(touch.clientX, touch.clientY);
              }
              isTouching = false;
              lastTouchDistance = null;
            }
            event.preventDefault();
          },
          { passive: false }
        );

        // MOBILE optimizations
        function applyMobileOptimizations() {
          const isMobile =
            "ontouchstart" in window || navigator.maxTouchPoints > 0;
          if (isMobile) {
            document.body.classList.add("mobile-device");
            renderer.setPixelRatio(
              window.devicePixelRatio > 1 ? 1.5 : 1
            );
            camera.position.set(0, 70, 150);
            composer.removePass(bloomPass);
            showMobileInstructions();
            totalAsteroids = Math.min(totalAsteroids, 1);
            scene.traverse(object => {
              if (object.isMesh) {
                object.frustumCulled = true;
              }
            });
            // Hide the controls panel...
            document.getElementById("controls").style.display = "none";
            // ...and ensure the toggle button is visible:
            document.getElementById("toggle-controls").style.display = "block";
          }
        }
        function showMobileInstructions() {
          const mobileInstructions = document.createElement("div");
          mobileInstructions.id = "mobile-instructions";
          mobileInstructions.innerHTML = `
            <div class="instructions-panel">
              <h3>Mobile Controls</h3>
              <ul>
                <li>One finger: Pan (swipe to move)</li>
                <li>Two fingers: Zoom in/out</li>
                <li>Quick tap: Select object</li>
              </ul>
              <button id="close-instructions" class="control-button">Got it!</button>
            </div>
          `;
          document.body.appendChild(mobileInstructions);
          const style = document.createElement("style");
          style.textContent = `
            #mobile-instructions {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0,0,0,0.7);
              z-index: 10000;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .instructions-panel {
              background: rgba(20,30,50,0.95);
              padding: 20px;
              border-radius: 15px;
              max-width: 85%;
              text-align: center;
              box-shadow: 0 5px 25px rgba(0,0,0,0.5);
              border: 1px solid rgba(255,255,255,0.1);
            }
            .instructions-panel h3 {
              margin-top: 0;
              color: #4a90e2;
            }
            .instructions-panel ul {
              text-align: left;
              margin: 15px 0;
              padding-left: 20px;
            }
          `;
          document.head.appendChild(style);
          document
            .getElementById("close-instructions")
            .addEventListener("click", function () {
              document.body.removeChild(mobileInstructions);
              localStorage.setItem("mobileInstructionsShown", "true");
            });
          if (localStorage.getItem("mobileInstructionsShown") === "true") {
            document.body.removeChild(mobileInstructions);
          }
        }
        function enableDeviceOrientationControls() {
          const isMobile =
            "ontouchstart" in window || navigator.maxTouchPoints > 0;
          if (isMobile && typeof DeviceOrientationEvent !== "undefined") {
            const deviceOrientationToggle = document.createElement("button");
            deviceOrientationToggle.id = "orientation-toggle";
            deviceOrientationToggle.textContent = "Enable Gyroscope";
            deviceOrientationToggle.classList.add("control-button");
            deviceOrientationToggle.style.position = "fixed";
            deviceOrientationToggle.style.bottom = "80px";
            deviceOrientationToggle.style.right = "10px";
            deviceOrientationToggle.style.zIndex = "1000";
            document.body.appendChild(deviceOrientationToggle);
            let gyroEnabled = false;
            deviceOrientationToggle.addEventListener("click", function () {
              if (!gyroEnabled) {
                if (typeof DeviceOrientationEvent.requestPermission === "function") {
                  DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                      if (permissionState === "granted") {
                        enableGyroscope();
                        this.textContent = "Disable Gyroscope";
                        gyroEnabled = true;
                      }
                    })
                    .catch(console.error);
                } else {
                  enableGyroscope();
                  this.textContent = "Disable Gyroscope";
                  gyroEnabled = true;
                }
              } else {
                disableGyroscope();
                this.textContent = "Enable Gyroscope";
                gyroEnabled = false;
              }
            });
            let deviceOrientation = null;
            function enableGyroscope() {
              deviceOrientation = new THREE.DeviceOrientationControls(camera);
              window.addEventListener("deviceorientation", updateOrientation);
            }
            function disableGyroscope() {
              if (deviceOrientation) {
                window.removeEventListener("deviceorientation", updateOrientation);
                deviceOrientation.disconnect();
                deviceOrientation = null;
              }
            }
            function updateOrientation() {
              if (deviceOrientation) {
                deviceOrientation.update();
              }
            }
          }
        }
        function addPerformanceModeToggle() {
          const isMobile =
            "ontouchstart" in window || navigator.maxTouchPoints > 0;
          if (isMobile) {
            const performanceToggle = document.createElement("button");
            performanceToggle.id = "performance-toggle";
            performanceToggle.textContent = "High Performance Mode";
            performanceToggle.classList.add("control-button");
            performanceToggle.style.position = "fixed";
            performanceToggle.style.bottom = "130px";
            performanceToggle.style.right = "10px";
            performanceToggle.style.zIndex = "1000";
            document.body.appendChild(performanceToggle);
            let highPerformance = false;
            performanceToggle.addEventListener("click", function () {
              highPerformance = !highPerformance;
              if (highPerformance) {
                if (asteroidBelt) {
                  asteroidBelt.visible = false;
                }
                renderer.shadowMap.enabled = false;
                scene.traverse(object => {
                  if (object.isLine) {
                    object.visible = false;
                  }
                });
                this.textContent = "Standard Mode";
              } else {
                if (asteroidBelt) {
                  asteroidBelt.visible = true;
                }
                renderer.shadowMap.enabled = true;
                scene.traverse(object => {
                  if (object.isLine) {
                    object.visible = true;
                  }
                });
                this.textContent = "High Performance Mode";
              }
            });
          }
        }

        applyMobileOptimizations();
        enableDeviceOrientationControls();
        addPerformanceModeToggle();
        animate();
      }
      // Animation loop with smooth pan integration and mobile button visibility update
      function animate() {
        requestAnimationFrame(animate);
        controls.update();
        let delta = clock.getDelta();
        const timeScale = parseFloat(document.getElementById("time-scale").value);
        const orbitScale = 50;
        const globalMultiplier = parseFloat(document.getElementById("semi-major").value);
        Object.entries(planetsGlobal).forEach(([key, planet]) => {
          const a =
            planet.data.semiMajorAxis *
            planet.data.semiMajorMultiplier *
            globalMultiplier *
            orbitScale;
          const ecc = planet.data.eccentricity;
          const b = a * Math.sqrt(1 - ecc * ecc);
          const orbitalSpeed =
            ORBITAL_MULTIPLIER *
            (2 * Math.PI / (planet.data.orbitalPeriod * REVOLUTION_SCALE)) *
            timeScale;
          planet.angle += orbitalSpeed * delta;
          if (planet.mesh) {
            planet.mesh.position.x = a * (Math.cos(planet.angle) - ecc);
            planet.mesh.position.z = b * Math.sin(planet.angle);
            const rotSpeed =
              ROTATION_MULTIPLIER *
              (2 * Math.PI / (Math.abs(planet.data.rotationPeriod) * ROTATION_SCALE)) *
              timeScale;
            planet.mesh.rotation.y +=
              (planet.data.rotationPeriod < 0 ? -rotSpeed : rotSpeed) * delta;
            planet.mesh.updateMatrix();
            if (planet.moons && planet.moons.length > 0) {
              planet.moons.forEach(m => {
                m.angle += orbitalSpeed * m.orbitSpeed * delta;
                m.mesh.position.set(
                  Math.cos(m.angle) * m.orbitRadius,
                  0,
                  Math.sin(m.angle) * m.orbitRadius
                );
                m.mesh.updateMatrix();
              });
            }
          }
        });
        if (followPlanetKey && planetsGlobal[followPlanetKey]) {
          const targetPos = planetsGlobal[followPlanetKey].mesh.position;
          controls.target.copy(targetPos);
          camera.position.lerp(
            targetPos.clone().add(new THREE.Vector3(0, 20, 50)),
            0.1
          );
        }
        if (asteroidBelt) {
          asteroidBelt.rotation.y += 0.0005;
        }
        if (panVelocity.lengthSq() > 0.001) {
          const panOffset = new THREE.Vector3();
          const right = new THREE.Vector3();
          camera.getWorldDirection(panOffset);
          right
            .crossVectors(camera.up, panOffset)
            .normalize()
            .multiplyScalar(panVelocity.x * 0.01);
          const forward = new THREE.Vector3();
          camera.getWorldDirection(forward)
            .normalize()
            .multiplyScalar(-panVelocity.y * 0.01);
          camera.position.add(right).add(forward);
          controls.target.add(right).add(forward);
          panVelocity.multiplyScalar(panDamping);
        }
        composer.render();
        // Update mobile buttons visibility every frame
        updateMobileButtonsVisibility();
      }

      // Update orbit line when parameters change
      function updateOrbitLine(planetKey) {
        const planetObj = planetsGlobal[planetKey];
        if (planetObj.orbitLine) {
          scene.remove(planetObj.orbitLine);
        }
        const orbitScale = 50;
        const globalMultiplier = parseFloat(
          document.getElementById("semi-major").value
        );
        const a =
          planetObj.data.semiMajorAxis *
          planetObj.data.semiMajorMultiplier *
          globalMultiplier *
          orbitScale;
        const ecc = planetObj.data.eccentricity;
        const b = a * Math.sqrt(1 - ecc * ecc);
        const orbitPoints = [];
        for (let i = 0; i <= 100; i++) {
          const theta = (i / 100) * Math.PI * 2;
          orbitPoints.push(a * (Math.cos(theta) - ecc), 0, b * Math.sin(theta));
        }
        const orbitGeometry = new THREE.BufferGeometry();
        orbitGeometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(orbitPoints, 3)
        );
        const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
        const newOrbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        newOrbitLine.frustumCulled = true;
        newOrbitLine.matrixAutoUpdate = false;
        scene.add(newOrbitLine);
        planetObj.orbitLine = newOrbitLine;
        if (planetObj.moons) {
          planetObj.moons.forEach(m => {
            if (m.orbitLine) {
              m.mesh.parent.remove(m.orbitLine);
            }
            const segments = 64;
            const moonOrbitPoints = [];
            for (let i = 0; i <= segments; i++) {
              const theta = (i / segments) * Math.PI * 2;
              moonOrbitPoints.push(
                Math.cos(theta) * m.orbitRadius,
                0,
                Math.sin(theta) * m.orbitRadius
              );
            }
            const moonOrbitGeometry = new THREE.BufferGeometry();
            moonOrbitGeometry.setAttribute(
              "position",
              new THREE.Float32BufferAttribute(moonOrbitPoints, 3)
            );
            const moonOrbitMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
            const newMoonOrbitLine = new THREE.Line(moonOrbitGeometry, moonOrbitMaterial);
            newMoonOrbitLine.frustumCulled = true;
            newMoonOrbitLine.matrixAutoUpdate = false;
            m.mesh.parent.add(newMoonOrbitLine);
            m.orbitLine = newMoonOrbitLine;
          });
        }
      }

      // Show object info in the side panel
      function showObjectInfo(userData) {
        if (userData.type === "asteroid") return;
        const infoPanel = document.getElementById("info-panel");
        const nameEl = document.getElementById("selected-planet-name");
        const iconEl = document.getElementById("selected-planet-icon");
        const infoContent = document.getElementById("planet-info");
        const adjustForm = document.getElementById("adjust-form");
        const nav = document.getElementById("nav");
        if (window.innerWidth < 768) {
          nav.style.display = "none";
          document.getElementById("controls").style.display = "none";
          document.getElementById("toggle-controls").style.display = "block";
        }
        let html = "";
        if (userData.type === "planet") {
          const planet = planetData[userData.key];
          selectedPlanetKey = userData.key;
          nameEl.textContent = planet.name;
          iconEl.style.backgroundImage = `url('texture/${planet.name.toLowerCase()}.png')`;
          html += `<p>${planet.description}</p>`;
          html += `<p><strong>Semi-major Axis (default):</strong> ${planet.semiMajorAxis} AU</p>`;
          html += `<p><strong>Eccentricity (default):</strong> ${planet.eccentricity}</p>`;
          html += `<p><strong>Orbital Period:</strong> ${planet.orbitalPeriod} Earth days</p>`;
          html += `<p><strong>Rotation Period:</strong> ${Math.abs(
            planet.rotationPeriod
          )} Earth days${planet.rotationPeriod < 0 ? " (retrograde)" : ""}</p>`;
          if (moonsData[userData.key]) {
            html += `<p><strong>Moons:</strong> ${moonsData[
              userData.key
            ].map(m => m.name).join(", ")}</p>`;
          }
          adjustForm.style.display = "block";
          document.getElementById("adjust-eccentricity").value = planet.eccentricity;
          document.getElementById("adjust-semi-major").value = 1;
          document.getElementById("adjust-ecc-value").textContent = planet.eccentricity;
          document.getElementById("adjust-semi-value").textContent = "1x";
        } else if (userData.type === "moon") {
          const parent = planetData[userData.parent];
          nameEl.textContent = "Moon: " + userData.name + " of " + parent.name;
          iconEl.style.backgroundImage = `url('texture/${userData.name.toLowerCase()}.png')`;
          html += `<p>${userData.description || "Detailed information not available."}</p>`;
          adjustForm.style.display = "none";
        } else if (userData.type === "sun") {
          nameEl.textContent = sunData.name;
          iconEl.style.backgroundImage = `url('texture/sun.png')`;
          html += `<p>${sunData.description}</p>`;
          adjustForm.style.display = "none";
        }
        infoContent.innerHTML = html;
        infoPanel.classList.add("active");
      }

      // Mini visualizations for lessons
      const miniVisualizations = [];
      function createMiniScene(containerId) {
        const container = document.getElementById(containerId);
        const loaderEl = container.querySelector(".loading");
        if (loaderEl) container.removeChild(loaderEl);
        const width = container.clientWidth;
        const height = Math.max(container.clientHeight, 250);
        const miniRenderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: true
        });
        miniRenderer.setPixelRatio(
          window.devicePixelRatio < 2 ? window.devicePixelRatio : 1
        );
        miniRenderer.setSize(width, height);
        container.appendChild(miniRenderer.domElement);
        const miniScene = new THREE.Scene();
        const miniCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        miniCamera.position.set(0, 0, 10);
        const miniControls = new OrbitControls(miniCamera, miniRenderer.domElement);
        miniControls.enableDamping = true;
        miniControls.dampingFactor = 0.05;
        miniControls.minDistance = 2;
        miniControls.maxDistance = 50;
        miniScene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        miniScene.add(directionalLight);
        function onResize() {
          const w = container.clientWidth;
          const h = Math.max(container.clientHeight, 250);
          miniCamera.aspect = w / h;
          miniCamera.updateProjectionMatrix();
          miniRenderer.setSize(w, h);
        }
        window.addEventListener("resize", onResize);
        const miniViz = {
          container,
          miniScene,
          miniCamera,
          miniRenderer,
          miniControls,
          update: function () {}
        };
        miniVisualizations.push(miniViz);
        return miniViz;
      }
      function createTextSprite(text) {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        ctx.fillText(text, 10, 40);
        return new THREE.Sprite(
          new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) })
        );
      }
      let lawVisualizationsInitialized = false;
      function initLawVisualizations() {
        if (lawVisualizationsInitialized) return;
        lawVisualizationsInitialized = true;
        initNewtonViz();
        initFirstLawViz();
        initSecondLawViz();
        initThirdLawViz();
        initExampleViz();
        animateMiniVisualizations();
      }
      function animateMiniVisualizations() {
        requestAnimationFrame(animateMiniVisualizations);
        miniVisualizations.forEach(viz => {
          viz.miniControls.update();
          if (viz.update) viz.update();
          viz.miniRenderer.render(viz.miniScene, viz.miniCamera);
        });
      }
      function initNewtonViz() {
        const viz = createMiniScene("newton-law-viz");
        const sphereGeom = new THREE.SphereGeometry(0.5, 32, 32);
        const mat1 = new THREE.MeshStandardMaterial({ color: 0x00ccff });
        const mat2 = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
        const mass1 = new THREE.Mesh(sphereGeom, mat1);
        mass1.position.set(-2, 0, 0);
        viz.miniScene.add(mass1);
        const mass2 = new THREE.Mesh(sphereGeom, mat2);
        mass2.position.set(2, 0, 0);
        viz.miniScene.add(mass2);
        const arrow = new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(-2, 0, 0),
          4,
          0xff0000
        );
        viz.miniScene.add(arrow);
        const distanceSprite = createTextSprite("Distance: 4 units");
        distanceSprite.scale.set(4, 1, 1);
        distanceSprite.position.set(0, -1.5, 0);
        viz.miniScene.add(distanceSprite);
        const forceSprite = createTextSprite("Force ∝ 1/r²");
        forceSprite.scale.set(4, 1, 1);
        forceSprite.position.set(0, 2.5, 0);
        viz.miniScene.add(forceSprite);
        let freeze = false;
        viz.miniRenderer.domElement.style.cursor = "pointer";
        viz.miniRenderer.domElement.addEventListener("click", function () {
          freeze = !freeze;
          if (freeze) {
            const dist = mass1.position.distanceTo(mass2.position).toFixed(2);
            const ctx = distanceSprite.material.map.image.getContext("2d");
            ctx.clearRect(0, 0, 256, 64);
            ctx.fillStyle = "white";
            ctx.font = "24px Arial";
            ctx.fillText("Distance: " + dist + " units", 10, 40);
            distanceSprite.material.map.needsUpdate = true;
          }
        });
      }
      function initFirstLawViz() {
        const viz = createMiniScene("first-law-viz");
        const starGeom = new THREE.SphereGeometry(0.4, 32, 32);
        const starMat = new THREE.MeshStandardMaterial({ color: 0xffdd00 });
        const star = new THREE.Mesh(starGeom, starMat);
        star.position.set(-1, 0, 0);
        viz.miniScene.add(star);
        const planetGeom = new THREE.SphereGeometry(0.2, 16, 16);
        const planetMat = new THREE.MeshStandardMaterial({ color: 0x00aaff });
        const planet = new THREE.Mesh(planetGeom, planetMat);
        viz.miniScene.add(planet);
        const a = 2,
          e = 0.6,
          b = a * Math.sqrt(1 - e * e);
        const points = [];
        for (let i = 0; i <= 100; i++) {
          const theta = (i / 100) * Math.PI * 2;
          points.push(new THREE.Vector3(a * (Math.cos(theta) - e), b * Math.sin(theta), 0));
        }
        const ellipse = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({ color: 0xffffff })
        );
        viz.miniScene.add(ellipse);
        const paramsSprite = createTextSprite("a = 2, e = 0.6");
        paramsSprite.scale.set(3, 1, 1);
        paramsSprite.position.set(0, -2.5, 0);
        viz.miniScene.add(paramsSprite);
        let angle = 0;
        let freeze = false;
        viz.miniRenderer.domElement.style.cursor = "pointer";
        viz.miniRenderer.domElement.addEventListener("click", function () {
          freeze = !freeze;
          if (freeze) {
            const x = a * (Math.cos(angle) - e).toFixed(2);
            const y = (b * Math.sin(angle)).toFixed(2);
            const ctx = paramsSprite.material.map.image.getContext("2d");
            ctx.clearRect(0, 0, 256, 64);
            ctx.fillStyle = "white";
            ctx.font = "24px Arial";
            ctx.fillText(`a=2, e=0.6, pos: (${x}, ${y})`, 10, 40);
            paramsSprite.material.map.needsUpdate = true;
          }
        });
        viz.update = function () {
          if (!freeze) {
            angle += 0.01;
          }
          planet.position.set(a * (Math.cos(angle) - e), b * Math.sin(angle), 0);
        };
      }
      function initSecondLawViz() {
        const viz = createMiniScene("second-law-viz");
        const starGeom = new THREE.SphereGeometry(0.4, 32, 32);
        const starMat = new THREE.MeshStandardMaterial({ color: 0xffdd00 });
        const star = new THREE.Mesh(starGeom, starMat);
        viz.miniScene.add(star);
        const planetGeom = new THREE.SphereGeometry(0.2, 16, 16);
        const planetMat = new THREE.MeshStandardMaterial({ color: 0x00aaff });
        const planet = new THREE.Mesh(planetGeom, planetMat);
        viz.miniScene.add(planet);
        const a = 3,
          e = 0.5,
          b = a * Math.sqrt(1 - e * e);
        const sectorGeom = new THREE.BufferGeometry();
        const sectorMat = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide
        });
        const sectorMesh = new THREE.Mesh(sectorGeom, sectorMat);
        viz.miniScene.add(sectorMesh);
        const areaSprite = createTextSprite("Area: calculating...");
        areaSprite.scale.set(3, 1, 1);
        areaSprite.position.set(0, -3, 0);
        viz.miniScene.add(areaSprite);
        let angle = 0;
        let freeze = false,
          freezeAngle = 0;
        viz.miniRenderer.domElement.style.cursor = "pointer";
        viz.miniRenderer.domElement.addEventListener("click", function () {
          freeze = !freeze;
          if (freeze) {
            freezeAngle = angle;
          }
        });
        function updateSector() {
          const segments = 30;
          let vertices = [0, 0, 0];
          for (let i = 0; i <= segments; i++) {
            const t = freeze ? (freezeAngle * i) / segments : (angle * i) / segments;
            vertices.push(a * (Math.cos(t) - e), b * Math.sin(t), 0);
          }
          const vertexArray = new Float32Array(vertices);
          sectorGeom.setAttribute("position", new THREE.BufferAttribute(vertexArray, 3));
          sectorGeom.computeVertexNormals();
          sectorGeom.setDrawRange(0, vertices.length / 3);
          if (freeze) {
            const frac = freezeAngle / (2 * Math.PI);
            const area = frac * Math.PI * a * b;
            const ctx = areaSprite.material.map.image.getContext("2d");
            ctx.clearRect(0, 0, 256, 64);
            ctx.fillStyle = "white";
            ctx.font = "24px Arial";
            ctx.fillText("Area ≈ " + area.toFixed(2) + " sq. units", 10, 40);
            areaSprite.material.map.needsUpdate = true;
          }
        }
        viz.update = function () {
          if (!freeze) {
            angle += 0.02;
          }
          planet.position.set(a * (Math.cos(angle) - e), b * Math.sin(angle), 0);
          updateSector();
        };
      }
      function initThirdLawViz() {
        const viz = createMiniScene("third-law-viz");
        const starGeom = new THREE.SphereGeometry(0.4, 32, 32);
        const starMat = new THREE.MeshStandardMaterial({ color: 0xffdd00 });
        const star = new THREE.Mesh(starGeom, starMat);
        viz.miniScene.add(star);
        const planet1 = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0x00aaff })
        );
        const planet2 = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0xff88aa })
        );
        viz.miniScene.add(planet1);
        viz.miniScene.add(planet2);
        function makeCircle(r) {
          const pts = [];
          for (let i = 0; i < 64; i++) {
            const theta = (i / 64) * Math.PI * 2;
            pts.push(new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), 0));
          }
          pts.push(new THREE.Vector3(r, 0, 0));
          return new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color: 0xffffff })
          );
        }
        const orbit1Radius = 2,
          orbit2Radius = 3.5;
        viz.miniScene.add(makeCircle(orbit1Radius));
        viz.miniScene.add(makeCircle(orbit2Radius));
        let angle1 = 0,
          angle2 = 0;
        const ratioSprite = createTextSprite("T² ∝ a³");
        ratioSprite.scale.set(3, 1, 1);
        ratioSprite.position.set(0, -3, 0);
        viz.miniScene.add(ratioSprite);
        let freeze = false;
        viz.miniRenderer.domElement.style.cursor = "pointer";
        viz.miniRenderer.domElement.addEventListener("click", function () {
          freeze = !freeze;
          if (freeze) {
            const periodRatio = (1).toFixed(2);
            const ctx = ratioSprite.material.map.image.getContext("2d");
            ctx.clearRect(0, 0, 256, 64);
            ctx.fillStyle = "white";
            ctx.font = "24px Arial";
            ctx.fillText("Period Ratio: " + periodRatio, 10, 40);
            ratioSprite.material.map.needsUpdate = true;
          }
        });
        viz.update = function () {
          if (!freeze) {
            angle1 += 0.03;
            angle2 += 0.03 / Math.pow(orbit2Radius / orbit1Radius, 1.5);
          }
          planet1.position.set(orbit1Radius * Math.cos(angle1), orbit1Radius * Math.sin(angle1), 0);
          planet2.position.set(orbit2Radius * Math.cos(angle2), orbit2Radius * Math.sin(angle2), 0);
        };
      }
      function initExampleViz() {
        const viz = createMiniScene("kepler-example-viz");
        const star = new THREE.Mesh(
          new THREE.SphereGeometry(0.4, 32, 32),
          new THREE.MeshStandardMaterial({ color: 0xffdd00 })
        );
        viz.miniScene.add(star);
        const mercury = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0xb1b1b1 })
        );
        viz.miniScene.add(mercury);
        const rMercury = 2;
        function makeCircleLine(r, color) {
          const pts = [];
          for (let i = 0; i < 64; i++) {
            const theta = (i / 64) * Math.PI * 2;
            pts.push(new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), 0));
          }
          pts.push(new THREE.Vector3(r, 0, 0));
          return new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color })
          );
        }
        viz.miniScene.add(makeCircleLine(rMercury, 0xaaaaaa));
        const labelSprite = createTextSprite("Mercury: T ≈ 0.253 yrs");
        labelSprite.scale.set(4, 1, 1);
        labelSprite.position.set(0, 2.5, 0);
        viz.miniScene.add(labelSprite);
        let angle = 0;
        let freeze = false;
        viz.miniRenderer.domElement.style.cursor = "pointer";
        viz.miniRenderer.domElement.addEventListener("click", function () {
          freeze = !freeze;
          if (freeze) {
            const ctx = labelSprite.material.map.image.getContext("2d");
            ctx.clearRect(0, 0, 256, 64);
            ctx.fillStyle = "white";
            ctx.font = "24px Arial";
            ctx.fillText("Mercury: T ≈ 0.253 yrs", 10, 40);
            labelSprite.material.map.needsUpdate = true;
          }
        });
        viz.update = function () {
          if (!freeze) {
            angle += 0.08;
          }
          mercury.position.set(rMercury * Math.cos(angle), rMercury * Math.sin(angle), 0);
        };
      }

      const keysPressed = {};
      document.addEventListener("keydown", function (event) {
        keysPressed[event.key.toLowerCase()] = true;
      });
      document.addEventListener("keyup", function (event) {
        keysPressed[event.key.toLowerCase()] = false;
      });

      document.addEventListener("DOMContentLoaded", function () {
        document.getElementById("toggle-controls").style.display = "none";

        const toggleControlsBtn = document.getElementById("toggle-controls");
        const controlsPanel = document.getElementById("controls");
        toggleControlsBtn.addEventListener("click", function () {
          controlsPanel.style.display = "block";
          toggleControlsBtn.style.display = "none";
          updateMobileButtonsVisibility();
        });
        document.getElementById("close-controls").addEventListener("click", function () {
          controlsPanel.style.display = "none";
          toggleControlsBtn.style.display = "block";
          updateMobileButtonsVisibility();
        });
        setTimeout(function () {
          const splashScreen = document.getElementById("splash-screen");
          splashScreen.style.opacity = "0";
          setTimeout(function () {
            splashScreen.style.display = "none";
            preloadAsteroids(() => {
              initSolarSystem();
            });
          }, 1500);
        }, 2500);
        document.getElementById("view-solar-system").addEventListener("click", function () {
          document.getElementById("solar-system").style.display = "block";
          document.getElementById("kepler-laws").style.display = "none";
          controlsPanel.style.display = "block";
          document.getElementById("nav").classList.remove("lessons");
          document.getElementById("nav").style.display = "block";
          updateMobileButtonsVisibility();
        });
        document.getElementById("view-kepler-laws").addEventListener("click", function () {
          document.getElementById("solar-system").style.display = "none";
          document.getElementById("kepler-laws").style.display = "block";
          controlsPanel.style.display = "none";
          document.getElementById("nav").classList.add("lessons");
          document.getElementById("nav").style.display = "block";
          // When lessons are active, hide mobile control buttons
          const performanceToggle = document.getElementById("performance-toggle");
          const orientationToggle = document.getElementById("orientation-toggle");
          const toggleControls = document.getElementById("toggle-controls");
          if (performanceToggle) performanceToggle.style.display = "none";
          if (orientationToggle) orientationToggle.style.display = "none";
          if (toggleControls) toggleControls.style.display = "none";
          initLawVisualizations();
          updateMobileButtonsVisibility();
        });
        document.querySelector(".close-btn").addEventListener("click", function () {
          document.getElementById("info-panel").classList.remove("active");
          if (window.innerWidth < 768) {
            document.getElementById("nav").style.display = "block";
          }
          updateMobileButtonsVisibility();
        });
        document.getElementById("time-scale").addEventListener("input", function () {
          document.getElementById("time-value").textContent = this.value + "x";
        });
        document.getElementById("eccentricity").addEventListener("input", function () {
          document.getElementById("eccentricity-value").textContent = this.value;
          Object.keys(planetsGlobal).forEach(key => {
            planetsGlobal[key].data.eccentricity = parseFloat(this.value);
            updateOrbitLine(key);
          });
        });
        document.getElementById("semi-major").addEventListener("input", function () {
          document.getElementById("semi-major-value").textContent = this.value + "x";
          Object.keys(planetsGlobal).forEach(key => updateOrbitLine(key));
        });
        document.getElementById("adjust-eccentricity").addEventListener("input", function () {
          if (selectedPlanetKey && planetsGlobal[selectedPlanetKey]) {
            const newEcc = parseFloat(this.value);
            planetsGlobal[selectedPlanetKey].data.eccentricity = newEcc;
            document.getElementById("adjust-ecc-value").textContent = newEcc;
            updateOrbitLine(selectedPlanetKey);
          }
        });
        document.getElementById("adjust-semi-major").addEventListener("input", function () {
          if (selectedPlanetKey && planetsGlobal[selectedPlanetKey]) {
            const newMultiplier = parseFloat(this.value);
            planetsGlobal[selectedPlanetKey].data.semiMajorMultiplier = newMultiplier;
            document.getElementById("adjust-semi-value").textContent = newMultiplier + "x";
            updateOrbitLine(selectedPlanetKey);
          }
        });
        document.getElementById("reset-adjust").addEventListener("click", function () {
          if (selectedPlanetKey && planetsGlobal[selectedPlanetKey]) {
            planetsGlobal[selectedPlanetKey].data.eccentricity = DEFAULT_ECCENTRICITY;
            planetsGlobal[selectedPlanetKey].data.semiMajorMultiplier = 1;
            document.getElementById("adjust-eccentricity").value = DEFAULT_ECCENTRICITY;
            document.getElementById("adjust-semi-major").value = 1;
            document.getElementById("adjust-ecc-value").textContent = DEFAULT_ECCENTRICITY;
            document.getElementById("adjust-semi-value").textContent = "1x";
            updateOrbitLine(selectedPlanetKey);
            showObjectInfo({ type: "planet", key: selectedPlanetKey });
          }
        });
        document.getElementById("reset-controls").addEventListener("click", function () {
          document.getElementById("time-scale").value = DEFAULT_TIME_SCALE;
          document.getElementById("time-value").textContent = DEFAULT_TIME_SCALE + "x";
          document.getElementById("eccentricity").value = DEFAULT_ECCENTRICITY;
          document.getElementById("eccentricity-value").textContent = DEFAULT_ECCENTRICITY;
          document.getElementById("semi-major").value = DEFAULT_SEMI_MAJOR_MULTIPLIER;
          document.getElementById("semi-major-value").textContent =
            DEFAULT_SEMI_MAJOR_MULTIPLIER + "x";
          Object.keys(planetsGlobal).forEach(key => {
            planetsGlobal[key].data.eccentricity = planetData[key].eccentricity;
            planetsGlobal[key].data.semiMajorMultiplier = 1;
            updateOrbitLine(key);
          });
        });
        document.getElementById("follow-planet").addEventListener("click", function () {
          if (followPlanetKey === selectedPlanetKey) {
            followPlanetKey = null;
            this.textContent = "Follow Planet";
          } else {
            followPlanetKey = selectedPlanetKey;
            this.textContent = "Stop Following";
          }
        });
      });

      function getDistance(t1, t2) {
        const dx = t2.clientX - t1.clientX;
        const dy = t2.clientY - t1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      }
