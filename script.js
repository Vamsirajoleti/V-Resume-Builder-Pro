// Clean Generic State
const defaultState = {
    personal: { fullName: '', jobTitle: '', email: '', phone: '', linkedin: '', github: '', portfolio: '', address: '', summary: '' },
    education: [],
    experience: [],
    projects: [],
    skills: { tech: '', soft: '' },
    internships: [],
    certifications: [],
    achievements: [],
    additional: { languages: '', interests: '', volunteer: '', publications: '', references: '' },
    declaration: { include: false, place: '', date: '' },
    settings: {
        template: 'tpl-modern',
        font: 'Inter',
        theme: 'dark',
        color: '#0284C7', // Default Ocean Blue
        experienceLevel: 'fresher' 
    }
};

let appState = JSON.parse(localStorage.getItem('vResumeProState_FinalV11'));

if (!appState) {
    appState = JSON.parse(JSON.stringify(defaultState));
}

// Fixed ATS Section Orders based on Experience Level
const layoutOrders = {
    fresher: ['summary', 'skills', 'projects', 'education', 'internships', 'certifications', 'achievements', 'additional', 'declaration'],
    experienced: ['summary', 'experience', 'skills', 'projects', 'education', 'certifications', 'achievements', 'additional', 'declaration']
};

const d = document;
const els = {
    preview: d.getElementById('resume-document'),
    navItems: d.querySelectorAll('.nav-item'),
    panels: d.querySelectorAll('.panel'),
    themeBtn: d.getElementById('theme-toggle-btn'),
    body: d.documentElement,
    zoomIn: d.getElementById('zoom-in'),
    zoomOut: d.getElementById('zoom-out'),
    zoomLevel: d.getElementById('zoom-level'),
    downloadBtn: d.getElementById('download-pdf'),
    mobileToggle: d.getElementById('mobile-toggle'),
    sidebar: d.querySelector('.sidebar'),
    completionBar: d.getElementById('completion-bar'),
    completionText: d.getElementById('completion-text'),
    atsScore: d.getElementById('ats-score'),
    atsStatus: d.getElementById('ats-status'),
    atsCircle: d.getElementById('ats-circle'),
    atsSuggestions: d.getElementById('ats-suggestions')
};

let currentZoom = window.innerWidth < 992 ? 0.45 : 1;

function init() {
    bindNavigation();
    bindInputs();
    bindDynamicButtons();
    bindDesignSettings();
    bindDataSync();
    
    applyTheme(appState.settings.theme);
    applyColor(appState.settings.color);
    
    populateForm();
    updatePreview();
}

function saveState() {
    localStorage.setItem('vResumeProState_FinalV11', JSON.stringify(appState));
    updatePreview();
    calculateATS();
    updateCompletion();
}

function bindNavigation() {
    els.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            els.navItems.forEach(n => n.classList.remove('active'));
            els.panels.forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            d.getElementById(`panel-${item.dataset.target}`).classList.add('active');
            if(window.innerWidth < 992) els.sidebar.classList.remove('open');
        });
    });
    els.mobileToggle.addEventListener('click', () => els.sidebar.classList.toggle('open'));
}

function bindInputs() {
    d.querySelectorAll('input[name="expLevel"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            appState.settings.experienceLevel = e.target.value;
            // Hide Work Experience input card if Fresher is selected
            d.getElementById('card-experience').style.display = e.target.value === 'fresher' ? 'none' : 'block';
            saveState();
        });
    });

    const bindings = [
        { id: 'fullName', path: ['personal', 'fullName'] }, { id: 'jobTitle', path: ['personal', 'jobTitle'] },
        { id: 'email', path: ['personal', 'email'] }, { id: 'phone', path: ['personal', 'phone'] },
        { id: 'linkedin', path: ['personal', 'linkedin'] }, { id: 'github', path: ['personal', 'github'] },
        { id: 'portfolio', path: ['personal', 'portfolio'] }, { id: 'address', path: ['personal', 'address'] },
        { id: 'summary', path: ['personal', 'summary'] }, { id: 'techSkills', path: ['skills', 'tech'] },
        { id: 'softSkills', path: ['skills', 'soft'] }, { id: 'languages', path: ['additional', 'languages'] },
        { id: 'interests', path: ['additional', 'interests'] }, { id: 'volunteer', path: ['additional', 'volunteer'] }, 
        { id: 'publications', path: ['additional', 'publications'] }, { id: 'references', path: ['additional', 'references'] }, 
        { id: 'declPlace', path: ['declaration', 'place'] }, { id: 'declDate', path: ['declaration', 'date'] }
    ];

    bindings.forEach(b => {
        const el = d.getElementById(b.id);
        if(el) {
            el.addEventListener('input', (e) => {
                appState[b.path[0]][b.path[1]] = e.target.value;
                saveState();
            });
        }
    });

    const includeDecl = d.getElementById('includeDeclaration');
    includeDecl.addEventListener('change', (e) => {
        appState.declaration.include = e.target.checked;
        d.getElementById('declaration-fields').style.display = e.target.checked ? 'block' : 'none';
        saveState();
    });
}

function populateForm() {
    d.getElementById(appState.settings.experienceLevel === 'experienced' ? 'exp-experienced' : 'exp-fresher').checked = true;
    
    // Set proper visibility of the Experience input card on load
    d.getElementById('card-experience').style.display = appState.settings.experienceLevel === 'fresher' ? 'none' : 'block';

    d.getElementById('fullName').value = appState.personal.fullName;
    d.getElementById('jobTitle').value = appState.personal.jobTitle;
    d.getElementById('email').value = appState.personal.email;
    d.getElementById('phone').value = appState.personal.phone;
    d.getElementById('linkedin').value = appState.personal.linkedin;
    d.getElementById('github').value = appState.personal.github;
    d.getElementById('portfolio').value = appState.personal.portfolio;
    d.getElementById('address').value = appState.personal.address;
    d.getElementById('summary').value = appState.personal.summary;
    d.getElementById('techSkills').value = appState.skills.tech;
    d.getElementById('softSkills').value = appState.skills.soft;
    
    d.getElementById('languages').value = appState.additional.languages;
    d.getElementById('interests').value = appState.additional.interests;
    d.getElementById('volunteer').value = appState.additional.volunteer;
    d.getElementById('publications').value = appState.additional.publications;
    d.getElementById('references').value = appState.additional.references;
    
    d.getElementById('includeDeclaration').checked = appState.declaration.include;
    d.getElementById('declaration-fields').style.display = appState.declaration.include ? 'block' : 'none';
    d.getElementById('declPlace').value = appState.declaration.place;
    d.getElementById('declDate').value = appState.declaration.date;

    ['education', 'experience', 'projects', 'internships', 'certifications', 'achievements'].forEach(type => {
        renderDynamicList(type);
    });
}

function bindDynamicButtons() {
    d.querySelectorAll('.add-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.dataset.type;
            const newItem = { id: Date.now().toString(), title: '', org: '', start: '', end: '', desc: '' };
            if (type === 'education') newItem.score = ''; 
            appState[type].push(newItem);
            renderDynamicList(type);
            saveState();
        });
    });
}

function renderDynamicList(type) {
    const container = d.getElementById(`${type}-list`);
    container.innerHTML = '';
    
    const labels = {
        education: { title: 'Degree / Course Name', org: 'College / School Name', desc: 'Relevant Coursework / Activities' },
        experience: { title: 'Job Title / Role', org: 'Company / Enterprise Name', desc: 'Description / Responsibilities' },
        projects: { title: 'Project Name', org: 'Tech Stack / Category', desc: 'Description / Key Features' },
        internships: { title: 'Role / Position', org: 'Company / Organization', desc: 'Description / Learnings' },
        certifications: { title: 'Certificate Name', org: 'Issuing Organization', desc: 'Description / Credential ID' },
        achievements: { title: 'Achievement / Award Name', org: 'Event / Organization', desc: 'Description / Context' }
    };
    const l = labels[type] || { title: 'Title', org: 'Organization', desc: 'Description' };

    appState[type].forEach((item, index) => {
        const div = d.createElement('div');
        div.className = 'dynamic-item';
        
        let specificInputs = '';
        if (type === 'education') {
            specificInputs = `<input type="text" class="input-field" style="grid-column: span 2;" placeholder="CGPA / Percentage / Marks" value="${item.score || ''}" oninput="updateDynamic('${type}', ${index}, 'score', this.value)">`;
        }

        div.innerHTML = `
            <button class="delete-btn" onclick="deleteDynamicItem('${type}', ${index})"><i class="fas fa-trash"></i></button>
            <div class="grid-2 mb-2">
                <input type="text" class="input-field" placeholder="${l.title}" value="${item.title}" oninput="updateDynamic('${type}', ${index}, 'title', this.value)">
                <input type="text" class="input-field" placeholder="${l.org}" value="${item.org}" oninput="updateDynamic('${type}', ${index}, 'org', this.value)">
                <input type="text" class="input-field" placeholder="Start Date" value="${item.start}" oninput="updateDynamic('${type}', ${index}, 'start', this.value)">
                <input type="text" class="input-field" placeholder="End Date" value="${item.end}" oninput="updateDynamic('${type}', ${index}, 'end', this.value)">
                ${specificInputs}
            </div>
            <textarea class="input-field" rows="2" placeholder="${l.desc}" oninput="updateDynamic('${type}', ${index}, 'desc', this.value)">${item.desc}</textarea>
        `;
        container.appendChild(div);
    });
}

window.updateDynamic = (type, index, field, value) => { appState[type][index][field] = value; saveState(); }
window.deleteDynamicItem = (type, index) => { appState[type].splice(index, 1); renderDynamicList(type); saveState(); }

els.themeBtn.addEventListener('click', () => {
    const isDark = appState.settings.theme === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    appState.settings.theme = newTheme;
    applyTheme(newTheme);
    saveState();
});

function applyTheme(theme) { 
    els.body.setAttribute('data-theme', theme); 
    els.themeBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

function applyColor(hexCode) {
    els.body.style.setProperty('--primary', hexCode);
}

function bindDesignSettings() {
    d.querySelectorAll('.template-btn[data-tpl]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            d.querySelectorAll('.template-btn[data-tpl]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            appState.settings.template = e.target.dataset.tpl;
            saveState();
        });
        if (btn.dataset.tpl === appState.settings.template) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    d.querySelectorAll('.template-btn[data-font]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            d.querySelectorAll('.template-btn[data-font]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            appState.settings.font = e.target.dataset.font;
            saveState(); 
        });
        if (btn.dataset.font === appState.settings.font) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    d.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', (e) => {
            d.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            e.target.classList.add('active');
            const newColor = e.target.dataset.color;
            appState.settings.color = newColor;
            applyColor(newColor);
            saveState();
        });
        if (swatch.dataset.color === appState.settings.color) swatch.classList.add('active');
        else swatch.classList.remove('active');
    });
}

function updatePreview() {
    const p = appState.personal;
    
    els.preview.className = `a4-paper ${appState.settings.template}`;
    els.preview.style.fontFamily = `"${appState.settings.font}", sans-serif`;

    const nameStr = p.fullName || '<span class="placeholder-text">Your Name</span>';
    const titleStr = p.jobTitle || '<span class="placeholder-text">Professional Title</span>';
    
    const contactLinks = [
        p.email ? `<span><i class="fas fa-envelope"></i> ${p.email}</span>` : '',
        p.phone ? `<span><i class="fas fa-phone"></i> ${p.phone}</span>` : '',
        p.linkedin ? `<span><i class="fab fa-linkedin"></i> ${p.linkedin}</span>` : '',
        p.github ? `<span><i class="fab fa-github"></i> ${p.github}</span>` : '',
        p.portfolio ? `<span><i class="fas fa-globe"></i> ${p.portfolio}</span>` : '',
        p.address ? `<span><i class="fas fa-map-marker-alt"></i> ${p.address}</span>` : ''
    ].filter(Boolean).join('');

    const defaultContact = `<span class="placeholder-text"><i class="fas fa-envelope"></i> email@example.com</span> <span class="placeholder-text"><i class="fas fa-phone"></i> +1 234 567 8900</span>`;

    let headerHtml = `
        <header class="res-header res-section">
            <h1>${nameStr}</h1>
            <h3 style="color: #64748b; margin-top:4px;">${titleStr}</h3>
            <div class="res-contact mt-2">${contactLinks || defaultContact}</div>
        </header>
    `;

    const renderers = {
        summary: () => {
            const sum = p.summary || '<span class="placeholder-text">A brief professional summary or career objective will appear here. Highlight your core strengths and career goals.</span>';
            return `<section class="res-section"><h2 class="res-title">Professional Summary</h2><p>${sum}</p></section>`;
        },
        skills: () => {
            let sHtml = '';
            const t = appState.skills.tech.split(',').filter(x=>x.trim());
            const s = appState.skills.soft.split(',').filter(x=>x.trim());
            
            sHtml += `<section class="res-section"><h2 class="res-title">Skills</h2><div style="display:flex; flex-direction:column; gap:8px;">`;
            if(t.length) {
                sHtml += `<div><strong>Technical:</strong> <ul class="res-skills" style="display:inline-flex; margin-left:8px;">${t.map(x=>`<li>${x.trim()}</li>`).join('')}</ul></div>`;
            } else if (appState.skills.tech === '' && appState.skills.soft === '') {
                 sHtml += `<div><strong>Technical:</strong> <ul class="res-skills" style="display:inline-flex; margin-left:8px;"><li class="placeholder-text">Skill 1</li><li class="placeholder-text">Skill 2</li><li class="placeholder-text">Skill 3</li></ul></div>`;
            }
            if(s.length) {
                sHtml += `<div><strong>Soft Skills/Tools:</strong> <ul class="res-skills" style="display:inline-flex; margin-left:8px;">${s.map(x=>`<li>${x.trim()}</li>`).join('')}</ul></div>`;
            }
            sHtml += `</div></section>`;
            return sHtml;
        },
        additional: () => {
            let aHtml = '';
            const l = appState.additional.languages; const i = appState.additional.interests;
            const v = appState.additional.volunteer; const pub = appState.additional.publications;
            const ref = appState.additional.references;
            
            if(l || i || v || pub || ref) {
                aHtml += `<section class="res-section"><h2 class="res-title">Additional Information</h2><div class="grid-2">`;
                if(l) aHtml += `<div><strong>Languages:</strong> <p>${l}</p></div>`;
                if(i) aHtml += `<div><strong>Interests:</strong> <p>${i}</p></div>`;
                if(v) aHtml += `<div><strong>Volunteer Work:</strong> <p>${v}</p></div>`;
                if(pub) aHtml += `<div><strong>Publications:</strong> <p>${pub}</p></div>`;
                if(ref) aHtml += `<div><strong>References:</strong> <p>${ref}</p></div>`;
                aHtml += `</div></section>`;
            }
            return aHtml;
        },
        declaration: () => {
            if(!appState.declaration.include) return '';
            const dt = appState.declaration;
            const nameToSign = p.fullName || 'Signature';

            return `<section class="res-section" style="margin-top: 30px;"><h2 class="res-title">Declaration</h2>
            <p>I hereby declare that the information provided above is true and accurate to the best of my knowledge.</p>
            <div style="display:flex; justify-content:space-between; align-items: flex-end; margin-top:30px;">
                <div><p><strong>Place:</strong> ${dt.place}</p><p><strong>Date:</strong> ${dt.date}</p></div>
                <div style="text-align:center; border-top:1px solid #333; padding-top:5px; width:200px; min-height: 50px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center;">
                    <div style="font-family: 'Caveat', cursive; font-size: 18pt; color: #111;">${nameToSign}</div>
                </div>
            </div></section>`;
        }
    };

    const renderList = (key, title, placeholderData) => {
        let data = appState[key];
        let isPlaceholder = false;
        if(!data || data.length === 0) {
            if (key === 'internships' || key === 'certifications' || key === 'achievements') return '';
            data = [placeholderData];
            isPlaceholder = true;
        }

        let lHtml = `<section class="res-section"><h2 class="res-title">${title}</h2>`;
        data.forEach(item => {
            const classTag = isPlaceholder ? 'placeholder-text' : '';
            
            let orgName = item.org || placeholderData?.org || 'Organization';
            let orgAndScore = orgName;
            
            if (key === 'education' && item.score) {
                orgAndScore += ` <span style="margin: 0 6px;">|</span> <span style="font-weight:600;">${item.score}</span>`;
            } else if (key === 'education' && isPlaceholder && placeholderData?.score) {
                 orgAndScore += ` <span style="margin: 0 6px;">|</span> <span style="font-weight:600;">${placeholderData.score}</span>`;
            }

            if(appState.settings.template === 'tpl-minimal') {
                lHtml += `
                <div class="res-item">
                    <div class="res-item-head">
                        <span class="${classTag}" style="font-weight:normal; font-size:10pt;">${item.start || 'Start'} ${item.end ? `- ${item.end}` : ''}</span>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:baseline;">
                            <span style="font-weight:600; color:#000;" class="${classTag}">${item.title || placeholderData?.title || 'Position Title'}</span>
                            <span class="res-item-sub ${classTag}">${orgAndScore}</span>
                        </div>
                        <p class="${classTag}" style="white-space: pre-line; margin-top:4px;">${item.desc || placeholderData?.desc || 'Description of responsibilities.'}</p>
                    </div>
                </div>`;
            } else {
                lHtml += `
                <div class="res-item">
                    <div class="res-item-head"><span class="${classTag}">${item.title || placeholderData?.title || 'Position Title'}</span><span class="${classTag}">${item.start || 'Start'} ${item.end ? `- ${item.end}` : ''}</span></div>
                    <div class="res-item-sub ${classTag}">${orgAndScore}</div>
                    <p class="${classTag}" style="white-space: pre-line;">${item.desc || placeholderData?.desc || 'Description of responsibilities and achievements.'}</p>
                </div>`;
            }
        });
        return lHtml + `</section>`;
    };

    const sectionMappers = {
        education: () => renderList('education', 'Education', {title: 'Degree / Course Name', org: 'College / School Name', start: '2020', end: '2024', desc: 'Relevant coursework and academic achievements.', score: 'CGPA: 3.8/4.0'}),
        experience: () => renderList('experience', 'Professional Experience', {title: 'Job Title / Role', org: 'Company / Enterprise Name', start: 'Start Date', end: 'Present', desc: 'Detail your responsibilities, impact, and achievements.'}),
        projects: () => renderList('projects', 'Projects', {title: 'Project Name', org: 'Tech Stack / Category', start: 'Start Date', end: 'End Date', desc: 'Explain the problem solved, your role, and the final outcome.'}),
        internships: () => renderList('internships', 'Internships / Training', {}),
        certifications: () => renderList('certifications', 'Certifications', {}),
        achievements: () => renderList('achievements', 'Achievements & Awards', {})
    };

    const currentLayoutOrder = layoutOrders[appState.settings.experienceLevel];

    if(appState.settings.template === 'tpl-creative') {
        let leftHtml = headerHtml + (renderers.skills() || '') + (renderers.additional() || '');
        let rightHtml = '';
        currentLayoutOrder.forEach(key => {
            if(['summary', 'education', 'experience', 'projects', 'internships', 'certifications', 'achievements', 'declaration'].includes(key)) {
                if(renderers[key]) rightHtml += renderers[key]();
                if(sectionMappers[key]) rightHtml += sectionMappers[key]();
            }
        });
        els.preview.innerHTML = `<div class="left-col">${leftHtml}</div><div class="right-col">${rightHtml}</div>`;
    } else {
        let bodyHtml = '';
        currentLayoutOrder.forEach(key => {
            if(renderers[key]) bodyHtml += renderers[key]();
            if(sectionMappers[key]) bodyHtml += sectionMappers[key]();
        });
        els.preview.innerHTML = headerHtml + bodyHtml;
    }
}

function updateCompletion() {
    let filled = 0; let total = 10;
    const p = appState.personal;
    if(p.fullName) filled++; if(p.email) filled++; if(p.phone) filled++; if(p.summary) filled++;
    if(appState.skills.tech.length > 0) filled++;
    if(appState.education.length > 0 && appState.education[0].title) filled += 2;
    if(appState.projects.length > 0 && appState.projects[0].title) filled += 2;
    if(appState.experience.length > 0 && appState.experience[0].title) filled++;
    
    const pct = Math.round((filled/total)*100);
    els.completionBar.style.width = `${pct}%`;
    els.completionText.innerText = `${pct}%`;
}

function calculateATS() {
    let score = 0;
    let suggestions = [];
    const p = appState.personal;
    
    if(p.email && p.phone) score += 15; else suggestions.push("<li><i class='fas fa-exclamation-circle'></i> Add email and phone number.</li>");
    if(p.linkedin) score += 10; else suggestions.push("<li><i class='fas fa-exclamation-circle'></i> Add LinkedIn profile.</li>");
    if(p.summary.length > 50) score += 15; else suggestions.push("<li><i class='fas fa-exclamation-circle'></i> Expand your professional summary.</li>");
    if(appState.skills.tech.split(',').length >= 5) score += 15; else suggestions.push("<li><i class='fas fa-exclamation-circle'></i> Add at least 5 technical skills.</li>");
    if(appState.education.length > 0 && appState.education[0].title) score += 15;
    
    if(appState.settings.experienceLevel === 'experienced') {
        if(appState.experience.length > 0 && appState.experience[0].title) score += 20; else suggestions.push("<li><i class='fas fa-exclamation-circle'></i> Add work experience (Crucial for Experienced Roles).</li>");
        if(appState.projects.length > 0 && appState.projects[0].title) score += 10;
    } else {
        if(appState.projects.length > 0 && appState.projects[0].title) score += 20; else suggestions.push("<li><i class='fas fa-exclamation-circle'></i> Add relevant projects (Crucial for Freshers).</li>");
        if(appState.internships.length > 0 && appState.internships[0].title) score += 10; else suggestions.push("<li><i class='fas fa-info-circle' style='color:var(--primary);'></i> Consider adding Internships to boost ATS score.</li>");
    }

    els.atsScore.innerText = score;
    let color = 'var(--danger)'; let text = 'Weak';
    if(score > 80) { color = 'var(--success)'; text = 'Excellent ATS Match'; }
    else if(score > 60) { color = 'var(--warning)'; text = 'Good Match'; }
    
    els.atsCircle.style.borderColor = color;
    els.atsStatus.innerText = text;
    els.atsStatus.style.color = color;
    
    if(suggestions.length === 0) suggestions.push("<li><i class='fas fa-check-circle text-success'></i> Your resume is highly optimized!</li>");
    els.atsSuggestions.innerHTML = suggestions.join('');
}

function exportPDF() {
    const element = els.preview;
    const originalTransform = element.style.transform;
    element.style.transform = 'scale(1)';
    
    const opt = {
        margin: 0,
        filename: `Resume_${appState.personal.fullName.replace(/\s+/g, '_') || 'Draft'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        element.style.transform = originalTransform;
    });
}

els.downloadBtn.addEventListener('click', exportPDF);
d.getElementById('mobile-download').addEventListener('click', exportPDF);

const applyZoom = () => { els.preview.style.transform = `scale(${currentZoom})`; els.zoomLevel.innerText = `${Math.round(currentZoom * 100)}%`; };
els.zoomIn.addEventListener('click', () => { if(currentZoom < 1.5) { currentZoom += 0.1; applyZoom(); }});
els.zoomOut.addEventListener('click', () => { if(currentZoom > 0.3) { currentZoom -= 0.1; applyZoom(); }});

d.getElementById('export-btn').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState));
    const a = d.createElement('a'); a.href = dataStr; a.download = "vresume_data.json"; a.click();
});

d.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try { appState = JSON.parse(e.target.result); saveState(); location.reload(); } 
            catch(err) { alert("Invalid JSON file"); }
        };
        reader.readAsText(file);
    }
});

d.getElementById('clear-data-btn').addEventListener('click', () => {
    if(confirm("Are you sure? All data will be erased.")) {
        localStorage.removeItem('vResumeProState_FinalV11'); location.reload();
    }
});

window.onload = () => {
    init();
    applyZoom();
    updateCompletion();
    calculateATS();
};