const path = require('path');
const tingle = require('./tingle');

module.exports = (Ferdi, settings) => {

  // UNREAD EMAIL COUNTER BADGE
  const getMessages = function getMessages() {
    let count = 0;
    if(null !== document.querySelector("div.top-menu-bar div[aria-label='Email'] div.counter")){
      count = +document.querySelector("div.top-menu-bar div[aria-label='Email'] div.counter").textContent.trim();
    }
    // Set Ferdi badge
    Ferdi.setBadge(count);
  };
  // Check for new messages every second and update the Ferdi badge
  Ferdi.loop(getMessages);

  // MODAL WITH IFRAME TO REPLACE NEW BROWSER WINDOW POPUPS
  // Inject the modal/overlay css
  Ferdi.injectCSS(path.join(__dirname, 'tingle.min.css'));

  // Generic wrapper for any global methods that we want to intercept
  function wrap(object, method, wrapper){
    var fn = object[method];
    return object[method] = function(){
      return wrapper.apply(this, [fn.bind(this)].concat(
        Array.prototype.slice.call(arguments)));
    };
  };

  // You may want to 'unwrap' the method later (setting the global method back to the original global method)
  /*function unwrap(object, method, orginalFn){
    object[method] = orginalFn;
  };*/

  let modal;

  // Any globally scoped function is considered a 'method' of the window object (if you are in the browser)
  // Here we wrap/intercept window.open(url, windowName, [windowFeatures]);
  wrap(window, "open", function(orginalFn){
    let originalParams = Array.prototype.slice.call(arguments, 1);
    let src = originalParams[0];
    //let windowFeatures = originalParams[2];  // eg. "resizable=1, width=860, height=600"
    let modalBoxWidth = "860px";
    let modalBoxHeight = "600px";
    let windowFeaturesArray = originalParams[2].split(',');
    windowFeaturesArray.forEach(function(windowFeaturesArrayElement) {
      let windowFeaturesArrayElementArray = windowFeaturesArrayElement.split("=");
      let key = windowFeaturesArrayElementArray[0].trim();
      if(key=='width'){
        modalBoxWidth = windowFeaturesArrayElementArray[1].trim()+"px";
      }
      else if(key=='height'){
        modalBoxHeight = windowFeaturesArrayElementArray[1].trim()+"px";
      }
    });
    console.log('window.open is being overridden');
    // Load the popup's url into a modal iframe/overlay
    // Instantiate new modal
    modal = new tingle.modal({
      footer: false,
      stickyFooter: false,
      closeMethods: ['overlay', 'escape'],
      //cssClass: ['custom-class-1', 'custom-class-2'],
      onOpen: function() {
        let modalBox = document.getElementsByClassName("tingle-modal-box")[0];
        modalBox.style.width=modalBoxWidth;
        modalBox.style.height=modalBoxHeight;
        document.getElementsByClassName("tingle-modal")[0].style.backgroundColor="rgba(0,0,0,0.8)";
        console.log('modal open');

        // Inject a substitute window.close event handler into the iframe
        const modalIframe = document.getElementById('modalIframe');
        const modalIframeWindow = modalIframe.contentWindow || modalIframe;
        const modalIframeDocument = modalIframe.contentDocument || modalIframeWindow.document;
        let script = modalIframeDocument.createElement("script");
        script.append(`
          window.close = function () {
            console.log('window.close fired!');
            let modalIframe = window.parent.document.getElementById('modalIframe');
            modalIframe.parentNode.removeChild(modalIframe);
          };
        `);
        modalIframeDocument.documentElement.appendChild(script);
      },
      onClose: function() {
        console.log('modal closed');
        modal.destroy();
        modal = null;
      },
      beforeClose: function() {
        return true; // close the modal
        // return false; // nothing happens
      }
    });
    // Set content
    modal.setContent('<iframe id="modalIframe" src="'+src+'" width="860" height="600" frameborder="0" allowfullscreen></iframe>');
    // Open modal
    modal.open();

    // Close modal when iframe is removed from the Dom
    document.body.addEventListener("DOMNodeRemoved", function(evt) {
      let removedNodeId = evt.target.id;
      if (removedNodeId=="modalIframe") {
        console.log("modalIframe removed");
        modal.close();
      }
    }, false);

    // Eg. Call the original window.open with the original params
    // orginalFn.apply(undefined, originalParams);
  });
};
