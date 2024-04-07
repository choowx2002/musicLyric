

class LrcFile {
    constructor(l) {
        Object.defineProperty(this, 'lyric', {
            get: function () {
                return l
            },
            set: function () {
                throw new Error("Not allow to modify")
            },
            configurable: false,
        });
    }

    createList() {
        let list = this.lyric.split("\n");
        var result = [];
        for (let i = 0; i < list.length; i++) {
            let data1 = list[i].split("]")[0];
            if (!data1) {
                continue
            }
            data1 = data1.substring(1);
            let data2 = list[i].split("]")[1] ?? "";
            const line = {
                type: "",
                time: "",
                value: "",
            }
            if (data1.includes("ti")) {
                line.type = "title";
                line.value = data1.split(":")[1];
            } else if (data1.includes("ar")) {
                line.type = "artist";
                line.value = data1.split(":")[1];
            } else if (data1.includes("al")) {
                line.type = "album";
                line.value = data1.split(":")[1];
            } else if (data1.includes("by")) {
                line.type = "creator";
                line.value = data1.split(":")[1];
            } else if (data1.includes("offset")) {
                line.type = "offset";
                line.value = data1.split(":")[1];
            } else {
                line.type = "lyric";
                line.value = data2;
                line.time = this.parseTime(data1);
            }
            result.push(line);
        }
        return result;
    }

    lyricList() {
        return this.createList().filter(l => l.type === "lyric" && l.value !== "");
    }

    parseTime(time) {
        var parts = time.split(':');
        return +parts[0] * 60 + +parts[1];
    }

    getInfo() {
        const fullList = this.createList().filter(l => l.time === "");
        let result = {}
        fullList.forEach(t => {
            result[t.type] = t.value;
        })
        return result;
    }
}

class UI {
    constructor(text) {
        this.info = new LrcFile(text);
        this.doms = {
            lyricBox: document.querySelector(".lyric-box"),
            musicPlayer: document.querySelector(".audio"),
            playPauseBtn: document.querySelector(".play-pause-button"),
            artist: document.querySelector(".artist"),
            title: document.querySelector(".title"),
            totalTimeBox: document.querySelector(".totalTime"),
            currentTimeBox: document.querySelector(".currentTime"),
            volumeInput: document.querySelector(".volume-input"),
            centerBox: document.querySelector(".center-box"),
            vValue: document.querySelector(".volume-percent"),
        }
        this.doms.volumeInput.addEventListener("input",(ev)=>{
            this.doms.centerBox.style.display = 'flex';
            this.doms.vValue.innerHTML = ev.target.value+"%";
            let volumePercent = ev.target.value / 100
            this.doms.musicPlayer.volume = volumePercent;
            document.documentElement.style.setProperty("--time", `-${volumePercent}s`);
        })
        this.doms.volumeInput.addEventListener("mouseup",(ev)=>{
            this.doms.centerBox.style.display = 'none';
        })
        if (this.info.lyricList()) {
            this.doms.musicPlayer.addEventListener("loadeddata", ()=>{
                this.doms.totalTimeBox.innerHTML = this.formatTime(this.doms.musicPlayer.duration)
            })
            this.appendLyric();
            this.fulfillInfo();
            this.setOffsetOfLyricBox();
        }
    }

    appendLyric() {
        var frag = document.createDocumentFragment();
        let lyricList = this.info.lyricList()
        for (var i = 0; i < lyricList.length; i++) {
            var li = document.createElement('li');
            if (lyricList[i].type !== "lyric") continue
            li.innerHTML = lyricList[i].value;
            li.classList.add("lyric-text");
            frag.appendChild(li);
        }
        this.doms.lyricBox.innerHTML = ""
        this.doms.lyricBox.appendChild(frag);
        if (!this.doms.playPauseBtn.children[0].getAttribute("clickFunc")) this.setupBtnFunc()
    }

    fulfillInfo() {
        const result = this.info.getInfo();
        this.doms.title.innerHTML = result.title
        this.doms.artist.innerHTML = result.artist
    }

    async startMusic() {
        try {
            this.doms.playPauseBtn.children[0].setAttribute("name", "pause-circle-outline");
            this.doms.musicPlayer.play()
            this.doms.musicPlayer.addEventListener('timeupdate', () => {
                this.setOffsetOfLyricBox();
            });
            this.doms.musicPlayer.addEventListener("ended", () => {
                this.doms.playPauseBtn.children[0].setAttribute("name", "play-circle-outline");
            });
        } catch (error) {
            console.error(error)
        }

    }

    pauseMusic() {
        this.doms.playPauseBtn.children[0].setAttribute("name", "play-circle-outline");
        this.doms.musicPlayer.pause()
    }


    /**
     * return -1 means at the start of song. 
     * if loop all nothing get then return last index
     * @returns 
     */
    findLyricListIndex() {
        var currentTime = this.doms.musicPlayer.currentTime;
        this.doms.currentTimeBox.innerHTML = this.formatTime(currentTime);
        let lyricList = this.info.lyricList()
        for (let i = 0; i < lyricList.length; i++) {
            if (lyricList[i].time && currentTime < lyricList[i].time) {
                return i - 1;
            }
        }
        return lyricList.length - 1;
    }

    setActiveIndex(index) {
        var li = this.doms.lyricBox.querySelector('.active');
        if (li) {
            li.classList.remove('active');
        }

        li = this.doms.lyricBox.children[index];
        if (li) {
            li.classList.add('active');
        }
    }

    setOffsetOfLyricBox() {
        var index = this.findLyricListIndex();
        this.setActiveIndex(index)
        let height = 0;
        let boxHeight = this.doms.lyricBox.clientHeight
        for (let i = 0; i < index; i++) {
            let value = this.doms.lyricBox.children[i].clientHeight;
            height += value
        }
        if (height <= boxHeight / 2) {
            let result = boxHeight / 2 - height - this.doms.lyricBox.children[index].clientHeight / 2
            this.doms.lyricBox.style.transform = `translateY(${result}px)`;
            return
        }
        let result = height - boxHeight / 2 + this.doms.lyricBox.children[index].clientHeight / 2;
        this.doms.lyricBox.style.transform = `translateY(-${result}px)`;
    }

    setupBtnFunc() {
        var btn = this.doms.playPauseBtn.children[0]
        btn.setAttribute("clickFunc", true)
        btn.addEventListener("click", () => {
            this.clickBtn()
        })
    }

    clickBtn() {
        console.log("click")
        if (this.doms.musicPlayer.paused) {
            console.log("play")
            this.startMusic()
        } else {
            console.log("pause")
            this.pauseMusic()
        }
    }

    changeAudio(fileURL) {
        this.pauseMusic()
        this.doms.musicPlayer.src = fileURL;
        this.findLyricListIndex()
        this.doms.totalTimeBox.innerHTML = this.formatTime(this.doms.musicPlayer.duration)
    }

    formatTime(time) {
        let minutes = Math.floor(time / 60)
        let timeForSeconds = time - (minutes * 60) // seconds without counted minutes 
        let seconds = Math.floor(timeForSeconds)
        let secondsReadable = seconds > 9 ? seconds : `0${seconds}` // To change 2:2 into 2:02
        return `${minutes}:${secondsReadable}`
    }


}

const getLyric = (link) => {
    return new Promise((resolve, reject) => {
        fetch(link)
            .then((res) => res.text())
            .then((text) => {
                resolve(text);
            })
            .catch((e) => reject(e));
    });
}

var ui
const uploadLyric = (link) => getLyric(link).then((text) => {
    ui = new UI(text);
    console.log(ui)
}).catch((err) => {
    console.log(err)
})

uploadLyric("src/assets/song.lrc");
var input = document.createElement('input');
input.setAttribute("accept", ".mp3, .lrc, .flac")
input.type = 'file';
var blob = window.URL || window.webkitURL;
if (!blob) {
    console.log('Your browser does not support Blob URLs :(');
}
input.onchange = e => {
    var file = e.target.files[0];
    if (["audio/mpeg", "audio/flac"].includes(file.type)) {
        ui.changeAudio(blob.createObjectURL(file))
    } else {
        var reader = new FileReader();
        reader.readAsText(file, 'UTF-8');

        reader.onload = readerEvent => {
            var content = readerEvent.target.result;
            ui = new UI(content);
        }
    }
}

document.querySelector(".uploadBtn").addEventListener("click", () => {
    input.click();
})