

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
        return this.createList().filter(l => l.time !== "");
    }

    parseTime(time) {
        var parts = time.split(':');
        return +parts[0] * 60 + +parts[1];
    }

    getInfo(){
        const fullList = this.createList().filter(l => l.time === "");
        let result = {}
        fullList.forEach(t=>{
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
            navBar: document.querySelector(".nav-bar"),
        }
        if(this.info.lyricList){
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
        this.doms.lyricBox.appendChild(frag);
        this.setupBtnFunc()
    }

    fulfillInfo(){
        const result = this.info.getInfo();
        console.log(result)
        let html = `<h2 class="title">${result?.title}</h2>
        <span class="artist">${result.artist}</span>
        `;
        this.doms.navBar.innerHTML = html
    }

    startMusic() {
        this.doms.playPauseBtn.children[0].setAttribute("name", "pause-circle-outline");
        this.doms.musicPlayer.play()
        this.doms.musicPlayer.addEventListener('timeupdate', () => {
            this.setOffsetOfLyricBox();
        });
        this.doms.musicPlayer.addEventListener("ended", ()=> {
            this.doms.playPauseBtn.children[0].setAttribute("name", "play-circle-outline");
        });
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
        if(height <= boxHeight/2 ){
            let result = boxHeight/2 - height - this.doms.lyricBox.children[index].clientHeight/2
            this.doms.lyricBox.style.transform = `translateY(${result}px)`;
            return
        }
        let result = height - boxHeight/2 + this.doms.lyricBox.children[index].clientHeight/2;
        this.doms.lyricBox.style.transform = `translateY(-${result}px)`;
    }

    setupBtnFunc(){
        var btn = this.doms.playPauseBtn.children[0]
        btn.addEventListener("click",()=>{
            this.clickBtn()
        })
    }

    clickBtn(){
        if(this.doms.musicPlayer.paused){
            this.startMusic()
        }else{
            this.pauseMusic()
        }
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
getLyric("src/assets/song.lrc").then((text) => {
    ui = new UI(text);
    console.log(ui)
}).catch((err) => {
    console.log(err)
})