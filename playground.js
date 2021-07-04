var run_button = document.querySelector('div.control button');
var render = document.querySelector('div.render');
var iframe = document.querySelector('div.render iframe');

function load_code(code) {
  run_button.disabled = true;
  render.classList.add('compiling');
  iframe.src = 'https://web.rgeometry.org/wasm/?code=' + encodeURIComponent(code);
}

var myCodeMirror = CodeMirror(document.querySelector('#editor'), {
  lineNumbers: true,
  value: '',
  mode: "rust",
  lineWrapping: true,
  extraKeys: {
    'Ctrl-Enter': function (cm) {
      load_code(cm.getValue());
    }
  }
});

myCodeMirror.on('change', function () {
  run_button.disabled = false;
});

run_button.onclick = () => load_code(myCodeMirror.getValue());

iframe.onload = function () {
  render.classList.remove('compiling');
}

Split({ // gutters specified in options
  columnGutters: [{
    track: 1,
    element: document.querySelector('.gutter'),
  }],
  onDragEnd: function () {
    myCodeMirror.refresh();
  }
});

const params = new URLSearchParams(window.location.search);
const gist = params.get('gist');
if (gist) {
  myCodeMirror.setValue('Fetching gist...');
  fetch('https://web.rgeometry.org/fetch-gist/raw/' + gist)
    .then(response => response.text())
    .then(data => {
      myCodeMirror.setValue(data);
      load_code(data);
    });
} else {
  const code = params.get('code') || `// Hit Ctrl-Enter to compile
use rgeometry_wasm::playground::*;
fn main() {
  clear_screen();
  set_viewport(2., 2.);
  for pt in &with_points(7) {
    render_point(&pt);
  }
}
`;

  myCodeMirror.setValue(code);
  load_code(code);
}


