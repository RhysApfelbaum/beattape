import { Track } from './track';
import { SliderState } from './sliderState';
import { LoadingState } from './bank';

export class PlayQueue {
    private tracklist: Track[];
    private history: Track[];
    private playedTracks = new Set<Track>();
    private sliderState: SliderState;

    public currentTrack: Track;
    public nextTracks: Track[];
    
    constructor(tracklist: Track[], sliderState: SliderState) {
        this.tracklist = tracklist;
        this.currentTrack = this.tracklist[0];
        this.nextTracks = [];
        this.history = [];
        this.playedTracks = new Set();
        this.sliderState = sliderState;
        this.fillNextTracks();
    }
    
    trackDistance(track: Track): number {
        let result = 0;

        // The current track should always be at the end of the playQueue, so it gets the biggest track distance.
        if (track == this.currentTrack) {
            return 1000;
        }

        // The mean difference between the current slider state and the track slider data...
        result += Math.abs(this.sliderState.grit - track.averageSliderState.grit);
        result += Math.abs(this.sliderState.brightness - track.averageSliderState.brightness);
        result += Math.abs(this.sliderState.chops - track.averageSliderState.chops);
        result += Math.abs(this.sliderState.vocals - track.averageSliderState.vocals);
        result /= 4;

        // ...with bias against tracks that have been recently played.
        result += this.recentScore(track) / 2;
        return result;
    }
    
    recentScore(track: Track): number {
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
        const oldNext = this.nextTracks;
        this.tracklist.sort(
            (a, b) => this.trackDistance(a) - this.trackDistance(b)
        );
            
        this.nextTracks = [];
        this.tracklist.forEach(track => {
            if (track == this.currentTrack) {
                return;
            }
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
        // return (
        //     <li className='track-label-changed'>
        //     </li>
        // );

        let unorderedListElement = document.querySelector('#play-queue');
        unorderedListElement.replaceChildren();
        this.nextTracks.forEach(track => {
            let li = document.createElement('li');
            li.innerText = track.displayName;
            
            if (track.changed) {
                li.className = 'track-label-changed';
                track.changed = false;
            } else {
                li.className = 'track-label';
            }
            unorderedListElement.appendChild(li);
        });
        document.querySelector('#current-track-name').innerHTML = this.currentTrack.displayName;
    }
    
    async pollLoading() {
        if (this.nextTracks[0].bank.loadingState == LoadingState.UNLOADED) {
            await this.nextTracks[0].fetch();
        }

        for (let i = 1; i < this.nextTracks.length; i++) {
            if (this.nextTracks[i].bank.loadingState == LoadingState.LOADED) {
                this.nextTracks[i].unload();
            }
        }
    }
}
