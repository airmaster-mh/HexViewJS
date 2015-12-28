// var $ = "", window = {};
$(document).ready(function () {
    "use strict";

    var UTIL = {
        remove_whitespace: function (str) {
            return str.replace(/\n/g, "").replace(/\t/g, "").replace(/\ /g, "").replace(/\r/g, "");
        },
        exitst: function (obj) {
            if (obj === "undefined" || obj === null) {
                return false;
            } else {
                return true;
            }
        }
    };

    (function (obj) {
        var HEX = '0123456789ABCDEF';

        var dec2_to_hex = function (dec) {
            if (dec < 0) {
                dec = 0;
            }
            if (dec > 255) {
                dec = 255;
            }
            return HEX.charAt(Math.floor(dec / 16)) + HEX.charAt(dec % 16);
        };

        var dec_to_hex8 = function (dec) {
            var str = "";
            var i = 3;
            while (i >= 0) {
                str += dec2_to_hex((dec >> (i * 8)) & 255);
                i = i - 1;
            }
            return str;
        };

        var dec_to_hex = function (dec, len) {
            if(len > 8) {
                len = 8;
            }
            var str = "";
            var i = Math.floor((len + 1) / 2) - 1;
            while (i >= 0) {
                str += dec2_to_hex((dec >> (i * 8)) & 255);
                i = i - 1;
            }
            return str;
        }
        obj.HEX = {
            dec2_to_hex: dec2_to_hex,
            dec_to_hex8: dec_to_hex8,
            dec_to_hex: dec_to_hex
        };
    }(UTIL));

    (function (obj) {
        var BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        obj.BASE64 = {
            decode: function (encoded) {
                if (!!window.atob) {
                    return window.atob(encoded);
                } else {
                    var output = "";
                    var chr1, chr2, chr3;
                    var enc1, enc2, enc3, enc4;
                    var i;
                    encoded = encoded.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                    for (i = 0; i < encoded.length; i += 4) {
                        enc1 = BASE64_CHARS.indexOf(encoded.charAt(i + 0));
                        enc2 = BASE64_CHARS.indexOf(encoded.charAt(i + 1));
                        enc3 = BASE64_CHARS.indexOf(encoded.charAt(i + 2));
                        enc4 = BASE64_CHARS.indexOf(encoded.charAt(i + 3));

                        chr1 = (enc1 << 2) | (enc2 >> 4);
                        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                        chr3 = ((enc3 & 3) << 6) | enc4;

                        output = output + String.fromCharCode(chr1);

                        if (enc3 !== 64) {
                            output = output + String.fromCharCode(chr2);
                        }

                        if (enc4 !== 64) {
                            output = output + String.fromCharCode(chr3);
                        }
                    }
                    return output;
                }
            },
            encode: function (decoded) {
                var decoded_string = "";
                if ($.isArray(decoded)) {
                    $.each(decoded, function (index, val) {
                        decoded_string += String.fromCharCode(val);
                    });
                    decoded = decoded_string;
                }
                if (!!window.btoa) {
                    return window.btoa(decoded);
                } else {
                    var output = "";
                    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                    var i;

                    for (i = 0; i < decoded.length; i += 3) {
                        chr1 = decoded.charCodeAt(i + 0);
                        chr2 = decoded.charCodeAt(i + 1);
                        chr3 = decoded.charCodeAt(i + 2);
                        enc1 = chr1 >> 2;
                        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                        enc4 = chr3 & 63;

                        if (isNaN(chr2)) {
                            enc3 = 64;
                            enc4 = 64;
                        } else if (isNaN(chr3)) {
                            enc4 = 64;
                        }
                        output = output + BASE64_CHARS.charAt(enc1) + BASE64_CHARS.charAt(enc2) + BASE64_CHARS.charAt(enc3) + BASE64_CHARS.charAt(enc4);    
                    }
                    return output;
                }
            }
        };
    }(UTIL));

    var Prompt = function (editor) {
        this.currentPrompt = null;
        this.currentVisualPrompt = null;
        var that = this;
        var currentIndex;
        var hexArray, visualTextArray;
        var hexMode = true;
        this.stopBlink = function () {
            if (!!this.currentPrompt) {
                this.currentPrompt.removeClass("blinking-cursor");
                this.currentPrompt.removeClass("edit-blinking-cursor");
                this.currentPrompt.removeClass("hexviewerwindow_cursor");
                this.currentVisualPrompt.removeClass("blinking-cursor");
                this.currentVisualPrompt.removeClass("edit-blinking-cursor");
                this.currentVisualPrompt.removeClass("hexviewerwindow_cursor");
                this.currentVisualPrompt.removeClass("edit_cursor");
                if (this.currentPrompt.text() !== null && this.currentPrompt.text().length < 2) {
                    this.currentPrompt.text((this.currentPrompt.text() + "00").substr(0, 2));
                }
                editor.update(currentIndex, this.currentPrompt.text());
            }
        };

        var editing = function () {
            if (!!that.currentPrompt && hexMode) {
                if (that.currentPrompt.hasClass("blinking-cursor")) {
                    that.currentPrompt.removeClass("blinking-cursor");
                    that.currentVisualPrompt.removeClass("hexviewerwindow_cursor");
                }
                that.currentPrompt.addClass("edit-blinking-cursor");
                that.currentVisualPrompt.addClass("edit_cursor");
            }
        };

        var getCurrentIndex = function () {
            var row, col;
            if (!!that.currentPrompt) {
                row = $(that.currentPrompt).closest("tr")[0].rowIndex - 1;
                col = $(that.currentPrompt).index() - 1;
                return (row * 16) + col;
            } else if (!!that.currentVisualPrompt) {
                row = $(that.currentVisualPrompt).closest("tr")[0].rowIndex - 1;
                col = $(that.currentVisualPrompt).index() - 18;
                return (row * 16) + col;
            } else {
                return -1;
            }
        };

        this.startBlink = function (target) {
            this.stopBlink();
            if (!!target) {
                var hexTable = $(target).closest("table")[0];
                hexArray = $(hexTable).find(".hexviewerwindow_code");
                visualTextArray = $(hexTable).find(".hexviewerwindow_visual");

                if (target.hasClass("hexviewerwindow_code")) {
                    hexMode = true;
                    this.currentPrompt = target;
                    this.currentVisualPrompt = null;
                    currentIndex = getCurrentIndex();
                    this.currentVisualPrompt = $(visualTextArray[currentIndex]);
                    this.currentPrompt.addClass("blinking-cursor");
                    this.currentVisualPrompt.addClass("hexviewerwindow_cursor");
                } else {
                    hexMode = false;
                    this.currentVisualPrompt = target;
                    this.currentPrompt = null;
                    currentIndex = getCurrentIndex();
                    this.currentPrompt = $(hexArray[currentIndex]);
                    this.currentPrompt.addClass("hexviewerwindow_cursor");
                    this.currentVisualPrompt.addClass("blinking-cursor");
                }
            }
        };

        this.type = function (keyCode) {
            if (hexMode) {
                if ((keyCode >= 48 && keyCode <= 57) || (keyCode >= 65 && keyCode <= 70) || (keyCode >= 97 && keyCode <= 102)) {
                    if(keyCode >= 97 && keyCode <= 102) {
                        keyCode = keyCode - 32;
                    }
                    if (!!this.currentPrompt && this.currentPrompt.text() !== null) {
                        if (this.currentPrompt.text().length >= 2) {
                            this.currentPrompt.text(String.fromCharCode(keyCode));
                            editing();
                        } else {
                            this.currentPrompt.text(this.currentPrompt.text() + String.fromCharCode(keyCode));
                            editor.update(currentIndex, this.currentPrompt.text());
                            this.moveRight();
                        }
                    }
                }
            } else {
                if (!!this.currentVisualPrompt && this.currentVisualPrompt.text() !== null) {
                    this.currentPrompt.text(UTIL.HEX.dec2_to_hex(keyCode));
                    editor.update(currentIndex, this.currentPrompt.text());
                    this.moveRight();
                }
            }
        };

        this.typeBack = function () {
            if (hexMode) {
                if (!!this.currentPrompt && this.currentPrompt.text() !== null) {
                    if (this.currentPrompt.text().length >= 2) {
                        this.currentPrompt.text(this.currentPrompt.text().substring(0, 1));
                        editing();
                    } else {
                        this.currentPrompt.text("00");
                        editor.update(currentIndex, "00");
                        this.moveLeft();
                    }
                }
            } else {
                if (!!this.currentVisualPrompt && this.currentVisualPrompt.text() !== null) {
                    this.currentPrompt.text("00");
                    editor.update(currentIndex, "00");
                    this.moveLeft();
                }
            }
        };

        this.typeEnter = function () {
            if (!!this.currentPrompt) {
                if (this.currentPrompt.text() !== null && this.currentPrompt.text().length < 2) {
                    this.currentPrompt.text((this.currentPrompt.text() + "00")
                        .substr(0, 2));
                }
                if (hexMode && this.currentPrompt.hasClass("edit-blinking-cursor")) {
                    this.currentPrompt.removeClass("edit-blinking-cursor");
                    this.currentVisualPrompt.removeClass("edit-cursor");
                    this.currentPrompt.addClass("blinking-cursor");
                    this.currentVisualPrompt.addClass("hexviewerwindow_cursor");
                }
                editor.update(currentIndex, this.currentPrompt.text());
            }
        };

        this.paste = function (text) {
            if (!!text) {
                var index = 0;
                var charVal;
                while (index < text.length) {
                    charVal = text.charCodeAt(index);
                    if (hexMode && ((charVal >= 48 && charVal <= 57) || (charVal >= 65 && charVal <= 70) || (charVal >= 97 && charVal <= 102))) {
                        if (charVal >= 97) {
                            charVal = charVal - 32;
                        }
                        this.type(charVal);
                    } else if (!hexMode) {
                        this.type(charVal);
                    }
                    index += 1;
                }
            }
        };

        var movePrompt = function (index) {
            if (!!that.currentPrompt) {
                var hexTable = $(that.currentPrompt).closest("table")[0];
                if (!!hexTable) {
                    if (hexArray.length > index) {
                        that.stopBlink();
                        that.currentPrompt = $(hexArray[index]);
                        that.currentVisualPrompt = $(visualTextArray[index]);
                        if (hexMode) {
                            that.currentPrompt.addClass("blinking-cursor");
                            that.currentVisualPrompt.addClass("hexviewerwindow_cursor");
                        } else {
                            that.currentPrompt.addClass("hexviewerwindow_cursor");
                            that.currentVisualPrompt.addClass("blinking-cursor");
                        }
                    }
                }
                currentIndex = index;
            }
        };

        this.moveRight = function () {
            if (currentIndex + 1 < hexArray.length) {
                movePrompt(currentIndex + 1);
            }
        };

        this.moveLeft = function () {
            if (currentIndex - 1 >= 0) {
                movePrompt(currentIndex - 1);
            }
        };

        this.moveUp = function () {
            if (currentIndex - 16 >= 0) {
                movePrompt(currentIndex - 16);
            }
        };

        this.moveDown = function () {
            if (currentIndex + 16 < hexArray.length) {
                movePrompt(currentIndex + 16);
            }
        };
    };

    var HexEditor = function (div, option) {
        this.div = div;
        this.decimal_offset = false;
        this.row_width = 16;
        this.word_size = 1;
        this.bin_data = [];
        this.offset_length = 8;
        if (!!option) {
            if (UTIL.exitst(option.decimal_offset)) {
                this.decimal_offset = option.decimal_offset;
            }
            if (UTIL.exitst(option.row_width)) {
                this.row_width = option.row_width;
            }
        }
        this.prompt = new Prompt(this);
    };

    HexEditor.prototype.render = function () {
        var table, tr, td, offset_td, text_td;
        var row_index, word_index, byte_index;
        var offset = 0, word, hex_value;
        var that = this;
        this.div.empty();
        table = $("<table>");
        table.addClass("hexviewerwindow_table");
        this.div.append(table);
        table.attr("tabindex", "0");
        table.keypress(function (e) {
            if (e.keyCode === 8) {
                that.prompt.typeBack();
                e.preventDefault();
            } else if (e.keyCode === 13) {
                that.prompt.typeEnter();
            } else if (e.keyCode === 37) {
                that.prompt.moveLeft();
            } else if (e.keyCode === 38) {
                that.prompt.moveUp();
            } else if (e.keyCode === 39) {
                that.prompt.moveRight();
            } else if (e.keyCode === 40) {
                that.prompt.moveDown();
            } else {
                that.prompt.type(e.keyCode);
            }
        });
        table.keydown(function (e) {
            if (e.keyCode === 8) {
                that.prompt.typeBack();
                e.preventDefault();
            } else if (e.keyCode === 13) {
                that.prompt.typeEnter();
            } else if (e.keyCode === 37) {
                that.prompt.moveLeft();
            } else if (e.keyCode === 38) {
                that.prompt.moveUp();
            } else if (e.keyCode === 39) {
                that.prompt.moveRight();
            } else if (e.keyCode === 40) {
                that.prompt.moveDown();
            }
        });
        $(table).on('click', ".hexviewerwindow_code, .hexviewerwindow_visual", function () {
            that.prompt.startBlink($(this));
        });

        $(table).on('paste', ".hexviewerwindow_code, .hexviewerwindow_visual", function (e) {
            var pasteText = null;
            try {
                pasteText = e.originalEvent.clipboardData.getData('text');
            } catch (err) {}
            if (!!pasteText) {
                that.prompt.paste(pasteText);
            }
        });

        tr = $("<tr>").addClass("hexviewerwindow");
        $(table).append($("<thead>").append(tr));
        
        tr.append($("<th>").addClass("hexviewerwindow_head_offset"));
        for (byte_index = 0; byte_index < this.row_width; byte_index += 1) {
            tr.append($("<th>").addClass("hexviewerwindow_head_code").text(UTIL.HEX.dec2_to_hex(byte_index)));
        }
        tr.append($("<th>").addClass("hexviewerwindow_head_visual_start"));
        for (byte_index = 0; byte_index < this.row_width; byte_index += 1) {
            tr.append($("<th>").addClass("hexviewerwindow_head_visual").text(" "));
        }
        tr.append($("<th>").addClass("hexviewerwindow_head_visual_end"));


        for (row_index = 0; row_index < this.bin_data.length; row_index += this.row_width) {
            tr = $("<tr>").addClass("hexviewerwindow");
            offset_td = $("<td>");
            offset_td.text(this.decimal_offset
                ? (Array(this.offset_length).join('0') + offset).slice(this.offset_length * -1)
                : "0x" + UTIL.HEX.dec_to_hex(offset, this.offset_length));
            offset_td.addClass("hexviewerwindow_offset");
            tr.append(offset_td);
            for (word_index = 0; word_index < this.row_width && (word_index + row_index) < this.bin_data.length; word_index += this.word_size) {
                td = $("<td>").addClass("hexviewerwindow_code");
                text_td = $("<td>").addClass("hexviewerwindow_visual");
                word = "";
                for (byte_index = 0; byte_index < this.word_size && (row_index + word_index + byte_index) < this.bin_data.length; byte_index += 1) {
                    hex_value = this.bin_data[row_index + word_index + byte_index];
                    word += UTIL.HEX.dec2_to_hex(hex_value);
                    if ((hex_value >= 32) && (hex_value <= 126)) {
                        text_td.text(String.fromCharCode(hex_value));
                    } else {
                        text_td.text(".");
                    }
                }
                td.text(word);
                if (word_index === 0) {
                    tr.append(td);
                    tr.append($("<td>").addClass("hexviewerwindow_visual_start"));
                    tr.append(text_td);
                }
                tr.find(".hexviewerwindow_code:last").after(td);
                tr.find(".hexviewerwindow_visual:last").after(text_td);
            }
            if (word_index < this.row_width) {
                td = $("<td>");
                text_td = $("<td>").addClass("hexviewerwindow_visual");
                tr.find(".hexviewerwindow_code:last").after(td);
                tr.find(".hexviewerwindow_visual:last").after(text_td);
                if (this.row_width - word_index > 1) {
                    td.attr("colspan", Math.floor(this.row_width - word_index));
                    text_td.attr("colspan", Math.floor(this.row_width - word_index));
                }
            }
            tr.find(".hexviewerwindow_visual:last").after($("<td>").addClass("hexviewerwindow_visual_end"));
            table.append(tr);
            offset += this.row_width;
        }
    };

    HexEditor.prototype.load = function (value) {
        var i;
        this.bin_data = [];
        if (typeof value === "number") {
            for (i = 0; i < value; i += 1) {
                this.bin_data.push(0);
            }
        } else {
            var decoded = UTIL.BASE64.decode(UTIL.remove_whitespace(value));
            for (i = 0; i < decoded.length; i += 1) {
                this.bin_data.push(decoded.charCodeAt(i));
            }
        }
        this.render();
    };

    HexEditor.prototype.resize = function (size) {
        var i;
        if (!!this.bin_data) {
            if (this.bin_data.length > size) {
                this.bin_data.length = size;
            } else {
                for (i = 0; i < size - this.bin_data.length; i += 1) {
                    this.bin_data.push(0);
                }
            }
        } else {
            for (i = 0; i < size; i += 1) {
                this.bin_data.push(0);
            }
        }
        this.render();
    };

    HexEditor.prototype.update = function (index, hexString) {
        this.bin_data[index] = parseInt(hexString, 16);

        if ((this.bin_data[index] >= 32) && (this.bin_data[index] <= 126)) {
            $(this.div.find(".hexviewerwindow_visual")[index]).text(String.fromCharCode(this.bin_data[index]));
        } else {
            $(this.div.find(".hexviewerwindow_visual")[index]).text(".");
        }
    };

    HexEditor.prototype.export = function () {
        return UTIL.BASE64.encode(this.bin_data);
    };

    HexEditor.prototype.hideOffset = function () {
        $('.hexviewerwindow_head_offset').hide();
        $('.hexviewerwindow_offset').hide();
    };

    HexEditor.prototype.showOffset = function () {
        $('.hexviewerwindow_head_offset').show();
        $('.hexviewerwindow_offset').showOffset();
    };

    HexEditor.prototype.hideVisual = function () {
        $('.hexviewerwindow_head_visual').hide();
        $('.hexviewerwindow_head_visual_start').hide();
        $('.hexviewerwindow_head_visual_end').hide();
        $('.hexviewerwindow_visual').hide();
        $('.hexviewerwindow_visual_start').hide();
        $('.hexviewerwindow_visual_end').hide();
    };

    HexEditor.prototype.showVisual = function () {
        $('.hexviewerwindow_head_visual').show();
        $('.hexviewerwindow_head_visual_start').show();
        $('.hexviewerwindow_head_visual_end').show();
        $('.hexviewerwindow_visual').show();
        $('.hexviewerwindow_visual_start').show();
        $('.hexviewerwindow_visual_end').show();
    };

    HexEditor.prototype.relocate = function (row_num) {
        this.row_width = row_num;
        this.render();
    };

    HexEditor.prototype.offsetResize = function (len) {
        this.offset_length = len;
        this.render();
    }

    if (!window.MEditor) {
        window.HexEditor = HexEditor;
    };

    // var viewer = new HexEditor($('.hexviewwindow'));
    // viewer.load("iVBORw0KGgoAAAANSUhEUgAAAnIAAAC6CAIAAAClaDcyAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAACiSSURBVHhe7Z1tq21XdcfvV2o0ofkiLVI1pugLv0QRo1Fb4lcoQWh8QoTgi1KoIggKoqilCYEiCNpUGhOvqWLOjeneZ547z7xzjof/");
});