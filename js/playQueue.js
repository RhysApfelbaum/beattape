class PlayQueue {
    
    constructor(tracklist) {
        this.tracklist = tracklist;
        this.currentTrack = this.tracklist[0];
        this.nextTracks = [];
        this.history = [];
        this.playedTracks = new Set();
        
        
        this.fillNextTracks();
    }
    
    // WARNING: THIS SUCKS
    // It's horrible and I'm just trying to make it work
    trackDistance(track) {
        
        let result = 0;
        if (track == this.currentTrack) return 1000;
        let grit = document.querySelector('#grit').value / 100;
        let brightness = document.querySelector('#brightness').value / 100;
        let chops = document.querySelector('#chops').value / 100;
        let vocals = document.querySelector('#vocals').value / 100;
        let gritDist = Math.abs(grit - track.sliderData.grit);
        let brightnessDist = Math.abs(brightness - track.sliderData.brightness);
        let chopsDist = Math.abs(chops - track.sliderData.chops);
        let vocalsDist = Math.abs(vocals - track.sliderData.vocals);
        result = (gritDist + brightnessDist + chopsDist + vocalsDist) / 4;
        result += this.recentScore(track) / 2;
        return result;
    }
    
    recentScore(track) {
        if (this.history.length == 0) return 0;
        let ordinal = this.history.length;
        for (let i = 0; i < this.history.length; i++) {
            if (this.history[i] == track) {
                ordinal = i;
                break;
            }
        }
        let result = 1.0 - ordinal / this.tracklist.length;
        if (ordinal < this.history.length) result+= 2;
        return result;
    }
    
    fillNextTracks() {
        let oldNext = this.nextTracks;
        this.tracklist.sort(
            (a, b) => this.trackDistance(a) - this.trackDistance(b)
            );
            
            this.nextTracks = [];
            this.tracklist.forEach(track => {
                if (track == this.currentTrack) return;
                if (this.nextTracks.length >= this.tracklist.length) return;
                this.nextTracks.push(track);
            });
            
        // If oldNext is an empty array, the webpage has just loaded, so all tracks are considered not changed
        if (oldNext.length == 0) {
            this.updateDisplay();
            return;
        }
        
        for (let i = 0; i < this.nextTracks.length; i++) {
            if (this.nextTracks[i] != oldNext[i])
            this.nextTracks[i].changed = true;
            else
            this.nextTracks[i].changed = false;
        }
        this.updateDisplay();
        this.pollLoading();
    }
    
    nextTrack() {
        this.playedTracks.add(this.currentTrack);
        
        // The track history begins with the most recently played track
        this.history.unshift(this.currentTrack);
        this.nextTracks.push(this.currentTrack);
        this.currentTrack = this.nextTracks.shift();
        this.updateDisplay();
        this.pollLoading();
    }
    
    lastTrack() {
        if (this.history.length == 0) return;
        this.nextTracks.pop();
        this.nextTracks.unshift(this.currentTrack);
        this.currentTrack = this.history.shift();
        this.updateDisplay();
        this.pollLoading();
    }
    
    updateDisplay() {
        let unorderedListElement = document.querySelector('#play-queue');
        unorderedListElement.replaceChildren();
        this.nextTracks.forEach(track => {
            //console.log(track);
            let li = document.createElement('li');
            li.innerText = track.displayName;
            
            if (track.changed) {
                li.className = 'track-label-changed';
                track.changed = false;
            }
            else li.className = 'track-label';
            unorderedListElement.appendChild(li);
        });
        document.querySelector('#current-track-name').innerHTML = this.currentTrack.displayName;
    }
    
    async pollLoading() {
        if (this.nextTracks[0].bank.loadingState == LOADING_STATE.UNLOADED) {
            await this.nextTracks[0].fetch();
        }

        for (let i = 1; i < this.nextTracks.length; i++) {
            if (this.nextTracks[i].bank.loadingState == LOADING_STATE.LOADED) {
                this.nextTracks[i].unload();
            }
        }
    }
}
