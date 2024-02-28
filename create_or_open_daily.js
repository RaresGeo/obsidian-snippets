const adapter = app.vault.adapter;
const { fs, path } = adapter;

const { create_new: tpCreateNewFile, find_tfile: tpFindTFile } = app.plugins.plugins?.["templater-obsidian"]
    ?.templater?.current_functions_object?.file
    || {};

function getVaultAbsolutePath() {
    return adapter.getBasePath();
}

async function getNoteStatus(inDirectory, noteType) {
    const notePath = `${inDirectory}/${noteType}/${dv.current().file.name}.md`;
    const content = await dv.io.load(notePath);

    return {
        notePath,
        exists: content !== undefined,
    }
}

function getTemplate(noteType) {
    const templatePath = path.join(getVaultAbsolutePath(), "templates", `${noteType}.md`);

    return fs.readFileSync(templatePath, "utf-8");
}

function fallbackMakeNote(notePath, noteType) {
    fs.writeFileSync(notePath, getTemplate(noteType));
}

async function createNewNote(inDirectory, noteType) {
    if (typeof tpCreateNewFile === "function" && typeof tpFindTFile === "function") {
        return await tpCreateNewFile(
            tpFindTFile(noteType), // Template to use
            dv.current().file.name, // File name
            false, // Open the file after creation
            app.vault.getAbstractFileByPath(`${inDirectory}/${noteType}`) // Directory to create it in
        );
    } else {
        fallbackMakeNote(
            path.join(getVaultAbsolutePath(), inDirectory, noteType, `${dv.current().file.name}.md`),
            noteType
        );

        return new Promise((resolve) => setTimeout(resolve, 150));
    }
}

async function render({ NOTE_TYPE, IN_DIRECTORY }) {
    const inDirectory = IN_DIRECTORY || "Daily";
    const { notePath, exists } = await getNoteStatus(inDirectory, NOTE_TYPE);
    const linkText = `[[${notePath}|${NOTE_TYPE}]]`;

    if (!exists) {
        const button = dv.el("button", `Open today's ${NOTE_TYPE}`);

        button.onclick = async () => {
            await createNewNote(inDirectory, NOTE_TYPE)
            await app.workspace.openLinkText(`${dv.current().file.name}.md`, `${inDirectory}/${NOTE_TYPE}/`, true);
        }

        return button;
    } else {
        return dv.paragraph(linkText);
    }
}

render(input);