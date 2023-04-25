const LoadingBar = () => {
  const domElement = document.createElement("div");
  domElement.style.position = "fixed";
  domElement.style.top = "0";
  domElement.style.width = "100%";
  domElement.style.height = "100%";
  domElement.style.background = "#000";
  domElement.style.opacity = "0.7";
  domElement.style.display = "flex";
  domElement.style.alignItems = "center";
  domElement.style.justifyContent = "center";
  domElement.style.zIndex = "1111";

  const barBase = document.createElement("div");
  barBase.style.background = "#aaa";
  barBase.style.width = "50%";
  barBase.style.minWidth = "250px";
  barBase.style.borderRadius = "10px";
  barBase.style.height = "15px";
  domElement.appendChild(barBase);

  const bar = document.createElement("div");
  bar.style.background = "#22a";
  bar.style.width = "50%";
  bar.style.borderRadius = "10px";
  bar.style.height = "100%";
  bar.style.width = "0";
  barBase.appendChild(bar);

  const onprogress = (delta) => {
    const progress = delta * 100;
    bar.style.width = `${progress}%`;
  };

  document.body.appendChild(domElement);

  return {
    get domElement() {
      return domElement;
    },
    set progress(delta) {
      const percent = delta * 100;
      bar.style.width = `${percent}%`;
    },
    set visible(value) {
      domElement.style.display = value ? "flex" : "none";
    },
  };
};

export { LoadingBar };
