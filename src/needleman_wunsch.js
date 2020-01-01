// borrowed from blievrouw.github.io/needleman-wunsch/
const NeedlemanWunsch = function (seq1, seq2, match_score, mismatch_penalty, gap_penalty, multigap_penalty) {

        // Intermediate scores matrix (scores for [`insert`, `match`, `delete`] positions)
        var I = [];
        // Score matrix (best score out of intermediate scores)
        var S = [];
        // Traceback matrix (boolean values for [`insert`, `match`, `delete`] positions)
        var T = [];
        // Alignments
        var final_alignments = [];

    /**
     * Calculates (intermediate) scores and tracebacks using provided parameters
     */
    (function calcScoresAndTracebacks() {
        S.push([0]);
        I.push([[null, null, null]]);
        T.push([[false, false, false]]);

        // Calculate scores and traceback on first row
        for (let j=1; j<seq2.length + 1; j++) {
            S[0].push(S[0][S[0].length - 1] + gap_penalty);
            I[0].push([null, null, null]);
            T[0].push([true, false, false]);
        }

        //if last penalty was a gap => used for eliminating sequences with
        lastWasGap = false;
        // Generate other rows
        for (let i=1; i<seq1.length + 1; i++) {
            S.push([S[i-1][0] + gap_penalty]);
            I.push([[null, null, null]]);
            T.push([[false, false, true]]);
            for (let j=1; j < seq2.length + 1; j++) {
                const insert = S[i][j-1] + (multigap_penalty ? I[i][j-1][0] || I[i][j-1][2] : gap_penalty);
                const del = S[i-1][j] + (multigap_penalty ? I[i][j-1][0] || I[i][j-1][2] : gap_penalty);
                // similarity
                let sim_score;
                if (seq1[i-1] === seq2[j-1]) {
                    sim_score = match_score;
                } else {
                    sim_score = mismatch_penalty;
                }
                const match = S[i-1][j-1] + sim_score;
                const intermediate_scores = [insert, match, del];
                const score = Math.max(...intermediate_scores);
                const tracebackTypeStatus = intermediate_scores.map((e, i) => e === score);
                S[i].push(score);
                I[i].push(intermediate_scores);
                T[i].push(tracebackTypeStatus);
            }
        }
    })()
    console.log(T);
    /**
     * Finds next alignment locations (children) from a position in scoring matrix
     * @param {number[]} pos m- Position in scoring matrix
     * @return {Object[]} children - Children positions and alignment types
     **/
     const alignmentChildren = function (pos) {
        let i, j, children;
        [i, j] = pos;
        children = [];
        const traceback_type_status = T[i][j];
        if (traceback_type_status[0]) { // insert
            children.push({pos: [i, j-1], tracebackType: 0});
        }
        if (traceback_type_status[1]) { // match
            children.push({pos: [i-1, j-1], tracebackType: 1});
        }
        if (traceback_type_status[2]) { // delete
            children.push({pos: [i-1, j], tracebackType: 2});
        }
        return children
    }

    /**
     * Runs through scoring matrix from bottom-right to top-left using traceback values to create all optimal alignments
     * @returns {Array}
     */
    final_alignments = (function alignmentTraceback() {
        let final_alignments = [];
        let root = {
            next: null,
            pos: [seq1.length, seq2.length],
            alignment: {
                seq1: "",
                seq2: ""
            }
        };
        let current, child, children, len, depth, alignment, pos, t;
        current = root;
        while(current) {
            pos = current.pos;
            alignment = current.alignment;
            // Get children alignments
            children = alignmentChildren(current.pos);
            // Store completed alignments
            if (!children.length) {
                final_alignments.push(alignment);
            }
            current = current.next;
            for (t=0, len=children.length; t<len; t++) {
                child = children[t];
                child.alignment = {
                    seq1: alignment.seq1.concat(child.tracebackType===0 ? "-" : seq1[pos[0]-1]), // -1 refers to offset between  scoring matrix and the sequence
                    seq2: alignment.seq2.concat(child.tracebackType===2 ? "-" : seq2[pos[1]-1])

                };
                // Move down a layer
                child.next = current;
                current = child;
            }
        }
        return final_alignments;
    })()
  return final_alignments;
}
