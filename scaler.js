import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import path from "path";
import { globSync } from 'glob';
import _ from 'lodash';

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

const RESCALED = '_rescaled'

const directoryOfAnims = 'C:\\Users\\BirdTho\\AppData\\Local\\VRChatProjects\\Arden 2022 NSFW\\Assets\\The Taper\\animations';

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

const scalar = 200.0724664917;

const entries = _.zip(files, outFiles);

//const keysSet = new Set();
entries.forEach(([file, outFile]) => {
    console.log(`parsing ${path.basename(file)}`);
    const data = readFileSync(file, { encoding: 'utf8' });
    //const yaml = parse(data);
    let lines = data.split('\n');
    // Object.keys(yaml.AnimationClip).forEach(key => keysSet.add(key));

    let m_Poshit = false;
    let value_hit = 0;
    let name_line = -1;
    console.log(` -- ${lines.length} lines`);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('m_Name')) {
            name_line = i;
        }
        if (!m_Poshit) {
            if (line.includes('m_PositionCurves:')) {
                m_Poshit = true;
            }
            continue; // skip lines until we get past m_PositionCurves
        } else if (DISRUPTING_EVENTS.find(evie => line.includes(evie))) {
            console.log('quit on line ', line);
            break;
        }

        if (line.includes('value:')) {
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
