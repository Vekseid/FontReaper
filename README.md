## Font Reaper

Font Reaper dismantles an icon font, such as Font Awesome, and builds a syntactically similar alternative. It uses [svgpath](https://github.com/fontello/svgpath) to flip, center, and align glyphs. I wrote it under Node 4, but it should hopefully be a bit version agnostic.

To use, after downloading/cloning and _npm install_, run:

    node reaper.js css/someiconfont.css

The result will get stored in the /out directory. The files currently there are the result of running this on Font Awesome.

This is a quick and dirty program, made out of a need to break up Font Awesome and fall back to something other than raster images or sprites. It does not have any business being a part of any build or deployment script. The expectation is that you will want to modify the files this script generates to suit your needs, and likely the script itself as well.

A proper solution would be to fix the problems with grunticon or something similar, and build from raw svg files accordingly.

All class names and aliases from the icon font are preserved. You can use this as `<i class="icon icon-whatever"><s class="screenreader-only">descriptive text goes here</s></i>`, much like you do with icon fonts.

I have included Font Awesome and the resulting output as an example.

### Why?

Seren Davies did a talk, [Death to Icon Fonts](https://www.youtube.com/watch?v=9xXBYcWgCHA), where she discusses her trouble with them as a person with dyslexia, and other issues with said fonts. My forums have a lot of members with dyslexia, and other members with a great variety of accessibility challenges besides.

Of course, the ideal solution is that user fonts should not clobber glyphs they don't have. There are certainly better font replacers available.

It would also be ideal that some of my forums' membership was not still chained to IE7. Yes, I have to write that sentence with all seriousness in 2016. Fortunately my visually impaired members are not so chained, or I would be a bit stumped.

Old browsers aside, SVGs as background or content properties _just work_, in the exact same manner, across a wide variety of environments and usages. There are [a lot of little issues](https://www.reddit.com/r/web_design/comments/44revh/font_reaper_replace_your_icon_font_with_a/czt5ylv) that make font-based solutions a less than optimal choice.

### background.css vs content.css

Font Reaper takes an icon font's css file, tries to read the svg file it specifies (place your fonts in the appropriate relative directory specified in said css), then builds a pair of .css files with the svg glyphs embedded as data uris.

out-background.css implements this in a _background-image_ property. This is the most robust solution, however, Opera Mini has a bug in its implementation of the _cover_ an _contain_ options for background-size. Hopefully this bug will get fixed soon.

out-content.css implements this in a _content_ property in _::before_. This functions properly in Opera Mini, however, it is a bit less forgiving about what you do with it. Font Reaper auto-squares glyphs specifically so this trick behaves relatively cleanly. Be careful with this trick if you are not using square glyphs.

Unfortunately, you cannot style the result normally. You have to either use css filters (not supported by IE or Opera Mini) and/or alter the script to embed your desired fill/stroke colors into the path elements.

### The IE7 and IE8 Fallbacks

Will hopefully not be needed for long. My IE7 and IE8 users are fully aware of their predicament and do not expect things to be flawless. They pray for an end to their nightmare; meanwhile, a shoddy fallback is better than nothing.

IE7 is IE7. If you need this I assume you are familiar with triggering hasLayout, expressions, yadda yadda. It implements [this hack by steveush](https://steveush.wordpress.com/2013/09/16/icon-fonts-in-internet-explorer-7/). It works even more reliably than the IE8 hack does.

You will notice a script in the generated test.html for IE8. It is based on [ausi's answer to this Stackoverflow question](http://stackoverflow.com/questions/9809351/ie8-css-font-face-fonts-only-working-for-before-content-on-over-and-sometimes), with some cleaning and an added delay. A delay of 0 has about a 50/50 chance of working in my experience, and does not seem to be much faster visually. It can additionally help to ensure that you are setting expiration headers for .eot files on your webserver.

IE8 has some serious issues trying to render a lot of different icons in pseudo-elements.

### Making fallbacks for other old browsers

You will want to modify the ie8 fallback css to load the appropriate font, and add in some javascript to load said css if it detects a lack of support for svg and/or data-uris.

I count my blessings that none of my membership requires this.

### Some notes about svg fragments

Since this script squares and normalizes each glyph to the same viewbox, making a composite svg with fragments would be easy.

[Support appears to be spotty, however](http://caniuse.com/svg-fragment). If I find out Safari actually handles these properly, I will update the script accordingly.

**Warning!**

**If you are going to use fragment identifiers anyway, please remember that screen readers do not read inside svg files.**

I saw a tutorial that did just this, and I have seen large, production sites following their advice.

It does not work.

While JAWS may be out of your price range, [NVDA](http://www.nvaccess.org/) is certainly affordable for you, and I highly recommend it.

### Final usage notes

This script can easily generate massive .css files, about 50-60% bigger than the svg file they originate from, which are already several times bigger than other font formats.

You should pick out the most important glyphs, along with the core icon classes, and put these into your main .css file in your \<head\>, for your above-the-fold / first 100ms content.

The rest of the icons you need should be in a separate stylesheet, loaded at the end of \<body\>.

The icons you do not need should not be loaded at all.