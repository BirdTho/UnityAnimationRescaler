import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import path from "path";
import { globSync } from 'glob';
import _ from 'lodash';

/**
 * Resizing consists of opening the anim file, and writing a modified copy, "<Anim name>_rescaled.anim"
 * The operation is non-destructive to the original files.
 * Running the script again will modify the _rescaled anims.
 */

const RESCALED = '_rescaled'

// Only animations in this directory will be resized.
// const directoryOfAnims = 'C:\\Users\\Username\\AppData\\Local\\VRChatProjects\\Avatar Project\\Assets\\Some Product\\animations';
const directoryOfAnims = '';

// TODO: You change this to be the ratio of your bone offsets to the prefab bone offsets. It will multiply all position offsets by this value.
const scalar = 2.000724664917; // Ratio by which to resize the animation.

// Do not touch
const DISRUPTING_EVENTS = [
    'm_ObjectHideFlags',
    'm_CorrespondingSourceObject',
    'm_PrefabInstance',
    'm_PrefabAsset',
    'm_Name',
    'm_Legacy',
    'm_Compressed',
    'm_UseHighQualityCurve',
    'm_RotationCurves',
    'm_CompressedRotationCurves',
    'm_EulerCurves',
    'm_ScaleCurves',
    'm_FloatCurves',
    'm_PPtrCurves',
    'm_SampleRate',
    'm_WrapMode',
    'm_Bounds',
    'm_ClipBindingConstant',
    'm_AnimationClipSettings',
    'm_EditorCurves',
    'm_EulerEditorCurves',
    'm_HasGenericRootTransform',
    'm_HasMotionFloatCurves',
    'm_Events'
];

// Nuke old anims
const filesToDelete = globSync(directoryOfAnims + `/*${RESCALED}.anim`).concat(globSync(directoryOfAnims + `/*${RESCALED}.anim.meta`));
filesToDelete.forEach(file => unlinkSync(file));
console.log(`Deleting ${filesToDelete.length} files`);

// Get original anims
let files = globSync(directoryOfAnims + '/*.anim');
files = files.filter((fn) => !fn.includes(RESCALED));
console.log('Files to rescale: ', files);

const outFiles = files.map((file) => {
    const tokens = file.split('.anim');
    return `${tokens[0]}${RESCALED}.anim`;
});


const entries = _.zip(files, outFiles);

//const keysSet = new Set();
entries.forEach(([file, outFile]) => {
    console.log(`parsing ${path.basename(file)}`);
    const data = readFileSync(file, { encoding: 'utf8' });
    //const yaml = parse(data);
    let lines = data.split('\n');
    // Object.keys(yaml.AnimationClip).forEach(key => keysSet.add(key));

    let m_Poshit = false;
    let m_Editorhit = false;
    let value_hit = 0;
    let name_line = -1;
    let positionCurvesDone = false;
    let editorCurvesDone = false;
    console.log(` -- ${lines.length} lines`);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('m_Name')) {
            name_line = i;
        }
        if (!positionCurvesDone) {
            if (!m_Poshit) {
                if (line.includes('m_PositionCurves:')) {
                    m_Poshit = true;
                }
            } else if (DISRUPTING_EVENTS.find(evie => line.includes(evie))) {
                console.log('quit on line ', line);
                positionCurvesDone = true;
            } else if (line.includes('value:')) {
                //console.log('Found a value to adjust');
                const lio = line.indexOf('value: ');
                const end = line.substring(lio + 7);
                const start = line.substring(0, lio + 7);
                // console.log('\nFrom:', line);
                // console.log(start);
                // console.log(end);
                const vec = JSON.parse(end.replaceAll(/(\w):/ig, '"$1":'));
                //console.log(vec);
                vec.x = vec.x * scalar;
                vec.y = vec.y * scalar;
                vec.z = vec.z * scalar;
                //console.log(vec);
                lines[i] = start + JSON.stringify(vec).replaceAll('"', '').replaceAll(/: ?/ig, ': ').replaceAll(',', ', ');
                // console.log('To:  ', lines[i]);
                value_hit++;
                continue;
            } else if (line.includes('inSlope:')) {
                //console.log('Found a value to adjust');
                const lio = line.indexOf('inSlope: ');
                const end = line.substring(lio + 9);
                const start = line.substring(0, lio + 9);
                // console.log('\nFrom:', line);
                // console.log(start);
                // console.log(end);
                const vec = JSON.parse(end.replaceAll(/(\w):/ig, '"$1":'));
                //console.log(vec);
                vec.x = vec.x * scalar;
                vec.y = vec.y * scalar;
                vec.z = vec.z * scalar;
                //console.log(vec);
                lines[i] = start + JSON.stringify(vec).replaceAll('"', '').replaceAll(/: ?/ig, ': ').replaceAll(',', ', ');
                // console.log('To:  ', lines[i]);
                value_hit++;
                continue;
            } else if (line.includes('outSlope:')) {
                //console.log('Found a value to adjust');
                const lio = line.indexOf('outSlope: ');
                const end = line.substring(lio + 10);
                const start = line.substring(0, lio + 10);
                // console.log('\nFrom:', line);
                // console.log(start);
                // console.log(end);
                const vec = JSON.parse(end.replaceAll(/(\w):/ig, '"$1":'));
                //console.log(vec);
                vec.x = vec.x * scalar;
                vec.y = vec.y * scalar;
                vec.z = vec.z * scalar;
                //console.log(vec);
                lines[i] = start + JSON.stringify(vec).replaceAll('"', '').replaceAll(/: ?/ig, ': ').replaceAll(',', ', ');
                // console.log('To:  ', lines[i]);
                value_hit++;
                continue;
            }
        }


        if (!editorCurvesDone) {
            if (!m_Editorhit) {
                if (line.includes('m_EditorCurves:')) {
                    m_Editorhit = true;
                }
            } else if (DISRUPTING_EVENTS.find(evie => line.includes(evie))) {
                console.log('quit on line ', line);
                editorCurvesDone = true;
                continue;
            } else if (line.startsWith('  - serializedVersion: 2')) {
                console.log('Found m_EditorCurves segment');
                let startIdx = i + 1;
                let endIdx = i + 1;
                let attribute = null;
                const valueIdxs = [];
                while (lines[endIdx].startsWith('    ')) {
                    if (lines[endIdx].includes(' attribute:')) {
                        attribute = lines[endIdx].split(': ')[1];
                    }
                    if (/(value|inSlope|outSlope):/ig.test(lines[endIdx])) {
                        valueIdxs.push(endIdx);
                    }
                    endIdx++;
                }
                endIdx--;

                if (attribute && attribute.includes('LocalPosition')) {
                    console.log('Rescaling data for attribute', attribute);
                    valueIdxs.forEach((idx) => {
                        const [start, end] = lines[idx].split(': ');
                        lines[idx] = start + ': ' + (parseFloat(end) * scalar).toString();
                        value_hit++;
                    });
                }

                i = endIdx;
            }
        }
    }
    // console.log(m_PositionCurves[0].curve.m_Curve);
    if (value_hit === 0) {
        console.log('found no tweens');
        return;
    } else {
        console.log(`Adjusted ${value_hit} values`);
    }
    if (name_line >= 0) {
        lines[name_line] = lines[name_line] + RESCALED;
        console.log('Renaming file', lines[name_line]);
    }
    writeFileSync(outFile, lines.join('\n'), { flag: 'w', encoding: 'utf8' });
    console.log('wrote file to', outFile)
});
// console.log(Array.from(keysSet));
