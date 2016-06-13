window.gh_ctags_data = {
  repo_slug: null,
  commit_hash: null,
  mouse: {
    x: null,
    y: null
  }
};

// Listen for events from background page: context menu click event, defintion results event
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.sender != "github-ctags-background-page") { return; }
    if (request.message_type == 'tag_query') {
      sendResponse(window.gh_ctags_data);
    } else if (request.message_type == 'definition_response') {
      console.log(request.found)
      console.log(request.results)
    } else if (request.message_type == 'error') {
      console.error(request.message)
    }
});

// Add event handler for right clicking in .file containers
function listenForRightClick() {
  $('.file').contextmenu(function(e){
    // eg. /mperham/sidekiq/blob/e4d09527c43816706587d86eef3b4036128b465e/lib/sidekiq.rb
    var file_url = $(this).find('.file-actions').children('a').attr('href');
    window.gh_ctags_data = extractInfo(file_url);
    window.gh_ctags_data.mouse = {};
    window.gh_ctags_data.mouse.x = e.clientX;
    window.gh_ctags_data.mouse.y = e.clientY;
  });
};

// Extract repo slug and commit hash from file URL.
function extractInfo(url) {
  url = url.substr(1); // remove leading /
  var repo_slug = url.split('/blob/')[0];
  var commit_hash = url.split('/blob/')[1];

  commit_hash = commit_hash.substr(0, 40);

  return {
    "repo_slug": repo_slug,
    "commit_hash": commit_hash
  };
};

function URLChangeDetector(window, interval_ms) {
  function currentURL() { return window.location.pathname; }

  var event = new Event('changed_page');
  var previous_url = currentURL();

  function monitor() {
    if (previous_url != currentURL()) {
      window.dispatchEvent(event);
      previous_url = currentURL();
    }
  }

  this.timer = setInterval(monitor, interval_ms);
}

function setup() {
  listenForRightClick();

  // Re-add event listeners for right click when we navigate to a new page. This is because Github prevents the page from
  // truly reloading when you navigate to a new page, instead loading the new page in an AJAXy way.
  window.addEventListener('changed_page', function() {
    listenForRightClick();
  });

  var detector = new URLChangeDetector(window, 500);
};

setup();