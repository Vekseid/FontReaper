'use strict';

function parse(css) {
  var arr = [],
    classes = css.replace(/\s+/g, '').replace(/}/g, "}\n").match(/^\.[a-z_-][a-z:,.0-9_-]*\{[^}]+}/igm);

  classes.forEach(function (item) {
    var matches = item.match(/content:\s*['"]\\([0-9a-f]{1,6})['"]/i), names = [];

    if (matches) {
      names = item.slice(0, item.indexOf('{')).match(/\.[a-z_-][a-z0-9_-]*/ig);
      arr.push({ glyph: matches[1], names: names});
    }
  });

  return arr;
}

function evalSVG(data, svg, size) {
  var arr = [], unitsperem = 1000, defwidth = 1000, defheight = 1000, defdescent=0,
    fontface, font, fontheight, scalefactor, temp, svgpath = require('svgpath');

  size = typeof size !== 'undefined' ?  size : 2048;

  svg = svg.replace(/"/g, "'");

  fontface = svg.match(/<font-face [^>]+>/)[0];

  temp = fontface.match(/units-per-em='([0-9][0-9.]+)'/);

  // TODO: Dimensions get more complicated than this. May need to analyze.
  if (temp && temp[1]) {
    unitsperem = parseFloat(temp[1]);
    defheight = unitsperem;
    defwidth = unitsperem;
  }

  temp = fontface.match(/descent='(-?[0-9][0-9.]+)'/);

  if (temp && temp[1]) {
    defdescent = parseFloat(temp[1]);
  }

  fontheight = defheight - defdescent;
  scalefactor = size / fontheight;

  font = svg.match(/<font [^>]+>/)[0];

  temp = font.match(/horiz-adv-x='([0-9][0-9.]+)'/);

  if (temp && temp[1]) {
    defwidth = parseFloat(temp[1]);
  }

  data.forEach(function (item) {
    var re = new RegExp('(<glyph [^&]+&#x' + item.glyph + ';[^/]+/>)'),
        glyph = svg.match(re), width, path, pathabs, pathrel;

    if (glyph && glyph[1]) {
      width = glyph[1].match(/horiz-adv-x='([0-9.]+)'/i);
      if (width && width[1]) {
        width = parseFloat(width[1]);
      }
      else {
        width = defwidth;
      }

      path = glyph[1].match(/d='([^']+)'/i);
      if (path && path[1]) {
        // Flip glyph
        path = svgpath(path[1]).scale(1, -1);

        if (width > fontheight) {
          // Rescale extra-wide fonts, don't try to move them out of the box.
          path = path.translate(0, defheight).scale(scalefactor / (width / fontheight));
        }
        else {
          // Narrow fonts need to be centered.
          path = path.translate((fontheight - width) / 2, defheight).scale(scalefactor);
        }

        pathrel = path.rel().toString();
        pathabs = path.abs().toString();
        path = path.toString();

        if (path.length > pathrel.length) {
          path = pathrel;
        }

        if (path.length > pathabs.length) {
          path = pathabs;
        }

        arr.push({
          glyph: item.glyph,
          path: path,
          names: item.names
                 });
      }
    }
  });

  return arr;
}


var fs = require('fs');
var args = process.argv.slice(2);
var css = fs.readFileSync(args[0], 'ascii');
var resvg = new RegExp("url\\(['\"]\\.\\./([a-z0-9./_-]+\\.svg)", 'i');
var reeot = new RegExp("url\\(['\"]\\.\\./([a-z0-9./_-]+\\.eot)", 'i');
var svgfile = css.match(resvg)[1];
var svg = fs.readFileSync(svgfile, 'ascii');
var eotfile = css.match(reeot);

if (eotfile) {
  eotfile = eotfile[1];
}

var data = parse(css);

var size = 2048;
var svgdata = evalSVG(data, svg, size);

// The pure css fix for IE8 does not function like people think it does.
// Seems to be cargo cult programming. Use a js fix instead.

var buffie7 = "/*! Generated by Font Reaper: https://github.com/Vekseid/FontReaper */\n\n" +
              "@font-face {\n" +
              "  font-family: 'IEFallback';\n" +
              "  src: url('../" + eotfile + "?v=');\n" +
              "  font-weight: normal;\n" +
              "  font-style: normal;\n" +
              "}\n\n" +
              ".icon {\n" +
              "  display: inline-block;\n" +
              "  *display: inline;\n" +
              "  zoom: 1;\n" +
              "  font: normal normal normal 14px/1 IEFallback;\n" +
              "  font-size: inherit;\n" +
              "  text-align: center;\n" +
              "  line-height: 1em;\n" +
              "  height: 1em;\n" +
              "  width: 1em;\n" +
              "}\n\n";
var buffie8 = buffie7;
var buffcontent = '';
var buffbackground = '';

// IE8 fix is a slightly modified version of ausi's answer here:
// http://stackoverflow.com/questions/9809351/ie8-css-font-face-fonts-only-working-for-before-content-on-over-and-sometimes
// Without the extra delay, the chance of it working on this test seems to be 50/50.

var buffhtml = "<!DOCTYPE html>\n" +
               "<html>\n" +
               "<head>\n" +
               "<meta charset=\"windows-1252\">\n" +
               "<title>Test Page</title>\n" +
               "<!--[if IE 7]>\n" +
               "  <link rel=\"stylesheet\" type=\"text/css\" href=\"out-ie7.css\">\n" +
               "<![endif]-->\n" +
               "<!--[if IE 8]>\n" +
               "  <link rel=\"stylesheet\" type=\"text/css\" href=\"out-ie8.css\">\n" +
               "  <script>\n" +
               "    var h = document.getElementsByTagName('head')[0],\n" +
               "    s = document.createElement('style');\n" +
               "    s.type = 'text/css';\n" +
               "    s.styleSheet.cssText = ':before,:after{content:none !important;}';\n" +
               "    h.appendChild(s);\n" +
               "    setTimeout(function(){ h.removeChild(s); },250);\n" +
               "  </script>\n" +
               "<![endif]-->\n" +
               "<!--[if gt IE 8]><!-->\n" +
               "  <link rel=\"stylesheet\" type=\"text/css\" href=\"out-background.css\">\n" +
               "<!--<![endif]-->\n" +
               "<style>\n" +
               "  .present {\n" +
               "    text-align: center;\n" +
               "    padding: 0.25em;\n" +
               "    margin: 0.25em;\n" +
               "    border: 1px solid black;\n" +
               "    display: inline-block;\n" +
               "    *display: inline;\n" +
               "    zoom: 1;\n" +
               "    width: 2em;\n" +
               "    line-height: 1.4em;\n" +
               "  }\n" +
               "</style>\n" +
               "</head>\n" +
               "<body>\n";

svgdata.forEach(function (item) {
  var line = '', linebefore = '', line8 = '';

  if (buffcontent.length) {
    //buffcontent += ', ';
    buffbackground += ', ';
  }
  else {
    buffcontent = "/*! Generated by Font Reaper: https://github.com/Vekseid/FontReaper */\n\n" +
                  ".icon {\n" +
                  "  display: inline-block;\n" +
                  "  vertical-align: middle;\n" +
                  "  height: 1em;\n" +
                  "  width: 1em;\n" +
                  "}\n\n";
    buffbackground = buffcontent;
  }

  item.names.forEach(function (name) {
    if (line.length) {
      line += ', ';
      linebefore += ', ';
      line8 = '';
    }
    line += name;
    linebefore += name + '::before';
    line8 += name + ':before';
  });

  // https://steveush.wordpress.com/2013/09/16/icon-fonts-in-internet-explorer-7/
  buffie7 += line + " { zoom: expression(this.runtimeStyle['zoom']='1',this.innerHTML='\\" + item.glyph + "'); }\n";
  buffie8 += line8 + " { content: '\\" + item.glyph + "'; }\n";

  buffhtml += "<div class='present'><span class=\"icon " + item.names[0].substr(1) + "\"></span><br>" + item.glyph + "</div>";
  buffbackground += line;
});

buffbackground += " {\n" +
                  "  background-size: contain;\n" +
                  "  background-position: center;\n" +
                  "  background-repeat: no-repeat;\n" +
                  "}\n\n";

buffhtml += "\n</body>\n" +
            "</html>";

svgdata.forEach(function (item) {
  var line = '', linebefore = '';

  item.names.forEach(function (name) {
    if (line.length) {
      line += ', ';
      linebefore += ', ';
    }
    line += name;
    linebefore += name + '::before';
  });

  buffcontent += linebefore + " { \n" +
                 "  content: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " +
                 size + ' ' + size + "'%3E%3Cpath d='" + item.path + "'/%3E%3C/svg%3E\");\n" +
                 "}\n";

  buffbackground += line + " { \n" +
                    "  background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " +
                    size + ' ' + size + "'%3E%3Cpath d='" + item.path + "'/%3E%3C/svg%3E\");\n" +
                    "}\n";
});

var fdie7 = fs.openSync('out/out-ie7.css', 'w');
var fdie8 = fs.openSync('out/out-ie8.css', 'w');
var fdcontent = fs.openSync('out/out-content.css', 'w');
var fdbackground = fs.openSync('out/out-background.css', 'w');
var fdhtml = fs.openSync('out/test.html', 'w');

fs.writeSync(fdie7, buffie7);
fs.writeSync(fdie8, buffie8);
fs.writeSync(fdcontent, buffcontent);
fs.writeSync(fdbackground, buffbackground);
fs.writeSync(fdhtml, buffhtml);