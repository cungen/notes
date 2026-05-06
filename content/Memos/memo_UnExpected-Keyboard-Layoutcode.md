---
title: "memo_UnExpected-Keyboard-Layoutcode"
draft: false
tags:
  - area/software/keyboard
  - kind/memo
  - state/verified
create_at: 2025-02-23T23:20:00
---

UnExpected Keyboard Layout#code

```xml
<?xml version="1.0" encoding="utf-8"?>
<!-- This file defines the QWERTY layout.

A layout is made of keys arranged into rows. Keys can be made bigger with the
'width' attribute and blank space can be added on the left of a key with the
'shift' attribute.

'key0' assigns the symbol on the middle of the key. 'key1', 'key2', etc..
assign symbols to the corners of a key, they are arranged like this:

  1 7 2
  5 0 6
  3 8 4

Keys prefixed with 'loc ' are not visible on the keyboard. They are used to
specify a place for a key, if it needed to be added to the layout later.
(for example, by the "Add keys to keyboard" option)

See bottom_row.xml for the definition of the bottom row and neo2.xml for a
layout that re-defines it.
See srcs/juloo.keyboard2/KeyValue.java for the keys that have a special meaning.
-->
<keyboard name="Code" script="latin">
  <row>
    <key key0="tab" key7="`" width="1.5" />
    <key key0="esc" width="1.5" key7="!" />
    <key key0="$" key7="^" />
    <key key0="*" key7="%" />
    <key key0="[" key7="{" key8="&lt;" />
    <key key0="]" key7="}" key8="&gt;" />
    <key key0="=" key7="+" />
    <key key0="\" key7="|" />
    <key key0="." key7="," />
  </row>
  <row>
    <key key0="q" key7="1" />
    <key key0="w" key7="2" />
    <key key0="e" key7="3" />
    <key key0="r" key7="4" />
    <key key0="t" key7="5" />
    <key key0="y" key7="6" />
    <key key0="u" key7="7" />
    <key key0="i" key7="8" />
    <key key0="o" key7="9" />
    <key key0="p" key7="0" />
  </row>
  <row>
    <key key0="a" key7="-" shift="0.5" />
    <key key0="s" key7="/" />
    <key key0="d" key7=":" />
    <key key0="f" key7=";" />
    <key key0="g" key7="(" />
    <key key0="h" key7=")" />
    <key key0="j" key7="~" />
    <key key0="k" key7="'" />
    <key key0="l" key7="&quot;"/>
  </row>
  <row>
    <key width="1.5" key0="shift"/>
    <key key0="z" key7="@" />
    <key key0="x" key7="_" />
    <key key0="c" key7="#" />
    <key key0="v" key7="&amp;" />
    <key key0="b" key7="\?" />
    <key key0="n" key7="`" />
    <key key0="m" key7="paste" />
    <key key0="backspace" width="1.5"/>
  </row>
</keyboard>
```