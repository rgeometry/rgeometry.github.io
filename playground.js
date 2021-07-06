let fmt_loaded = false;

const run_button = document.querySelector('div.control button');
const render = document.querySelector('div.render');
const iframe = document.querySelector('div.render iframe');

function load_code(code) {
  run_button.disabled = true;
  render.classList.add('compiling');
  iframe.src = 'https://web.rgeometry.org/wasm/?code=' + encodeURIComponent(code);
}

function format_code(cm) {
  if (fmt_loaded) {
    const result = wasm_bindgen.rustfmt(cm.getValue());
    const err = result.error();
    if (err) {
      console.log('rustfmt error:', err);
    } else if (result.code() !== cm.getValue()) {
      const cursor = cm.getCursor();
      const { left, top } = cm.getScrollInfo();
      cm.setValue(result.code());
      cm.setCursor(cursor);
      cm.scrollTo(left, top);
    }
    result.free();
  }
}

var myCodeMirror = CodeMirror(document.querySelector('#editor'), {
  lineNumbers: true,
  value: '',
  mode: "rust",
  lineWrapping: true,
  indentUnit: 4,
  keyMap: 'sublime',
  extraKeys: {
    'Ctrl-Enter': function (cm) {
      if (!run_button.disabled) {
        format_code(cm);
        load_code(cm.getValue());
      }
    }
  }
});

myCodeMirror.on('change', function () {
  run_button.disabled = false;
});

run_button.onclick = () => {
  format_code(myCodeMirror);
  load_code(myCodeMirror.getValue())
};

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

wasm_bindgen('wasm_rustfmt_bg.wasm').then(() => {
  fmt_loaded = true;
  format_code(myCodeMirror);
});

