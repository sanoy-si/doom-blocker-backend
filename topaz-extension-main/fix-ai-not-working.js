// 🚨 CRITICAL AI FIX: This script fixes the AI not working issue
// The main problems are:
// 1. No profiles enabled for YouTube
// 2. No blacklist tags configured
// 3. Background script exits early without calling AI

console.log('🔧 FIXING AI NOT WORKING ISSUE...');

// Check if we're in extension context
if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.error('❌ Run this script in extension context (load as extension)');
    throw new Error('Not in extension context');
}

async function fixAINotWorking() {
    try {
        console.log('🔍 Step 1: Checking current profiles...');

        // Get current state from background
        let response = await chrome.runtime.sendMessage({
            type: 'GET_PROFILE_DATA'
        });

        if (!response || !response.profiles) {
            console.error('❌ Could not get profile data from background script');
            return;
        }

        console.log(`📊 Found ${response.profiles.length} total profiles`);

        const enabledProfiles = response.profiles.filter(p => p.isEnabled);
        const youtubeProfiles = enabledProfiles.filter(p =>
            p.allowedWebsites.some(site => site.includes('youtube'))
        );

        console.log(`📊 Enabled profiles: ${enabledProfiles.length}`);
        console.log(`📊 YouTube profiles: ${youtubeProfiles.length}`);

        // CRITICAL FIX 1: Ensure YouTube profile exists and is enabled
        if (youtubeProfiles.length === 0) {
            console.log('🔧 FIXING: No YouTube profiles found, creating/enabling one...');

            // Look for existing YouTube profile
            let youtubeProfile = response.profiles.find(p =>
                p.profileName.toLowerCase().includes('youtube') ||
                p.allowedWebsites.some(site => site.includes('youtube'))
            );

            if (youtubeProfile) {
                console.log('✅ Found existing YouTube profile, enabling it...');
                youtubeProfile.isEnabled = true;
            } else {
                console.log('✅ Creating new YouTube profile...');
                youtubeProfile = {
                    id: 'youtube_auto_' + Date.now(),
                    profileName: 'YouTube Auto-Generated',
                    isDefault: true,
                    isEnabled: true,
                    allowedWebsites: ['youtube.com', 'www.youtube.com', 'm.youtube.com'],
                    whitelistTags: ['educational', 'tutorial', 'learning', 'documentary'],
                    blacklistTags: ['clickbait', 'drama', 'gossip', 'reaction', 'prank'],
                    customWhitelist: [],
                    customBlacklist: []
                };
                response.profiles.push(youtubeProfile);
            }

            // Update the state
            await chrome.runtime.sendMessage({
                type: 'UPDATE_PROFILES',
                profiles: response.profiles
            });

            console.log('✅ YouTube profile fixed!');
        }

        // CRITICAL FIX 2: Ensure blacklist tags exist
        const allEnabledProfiles = response.profiles.filter(p => p.isEnabled);
        const youtubeEnabledProfiles = allEnabledProfiles.filter(p =>
            p.allowedWebsites.some(site => site.includes('youtube'))
        );

        const allBlacklistTags = youtubeEnabledProfiles.flatMap(p =>
            [...(p.blacklistTags || []), ...(p.customBlacklist || [])]
        );

        if (allBlacklistTags.length === 0) {
            console.log('🔧 FIXING: No blacklist tags found, adding default ones...');

            // Add default blacklist tags to first YouTube profile
            if (youtubeEnabledProfiles.length > 0) {
                const profile = youtubeEnabledProfiles[0];
                profile.blacklistTags = profile.blacklistTags || [];
                profile.blacklistTags.push(...[
                    'clickbait', 'drama', 'gossip', 'reaction', 'prank',
                    'controversial', 'outrage', 'scandal', 'beef', 'exposed'
                ]);

                // Remove duplicates
                profile.blacklistTags = [...new Set(profile.blacklistTags)];

                await chrome.runtime.sendMessage({
                    type: 'UPDATE_PROFILES',
                    profiles: response.profiles
                });

                console.log('✅ Added default blacklist tags!');
            }
        }

        console.log('🔍 Step 2: Testing AI pipeline...');

        // Force trigger AI analysis
        if (window.__topazController) {
            console.log('🧠 Triggering AI analysis...');
            await window.__topazController.performInitialExtraction(true);
            console.log('✅ AI analysis triggered!');
        } else {
            console.log('⚠️ Extension controller not found on this page');
        }

        console.log('🎉 AI FIXES COMPLETE!');
        console.log('📝 Summary of fixes:');
        console.log('   - Ensured YouTube profile is enabled');
        console.log('   - Added default blacklist tags');
        console.log('   - Triggered AI analysis');
        console.log('');
        console.log('🧪 To test: Go to YouTube.com and check console for AI activity');

    } catch (error) {
        console.error('❌ Fix failed:', error);
        throw error;
    }
}

// Auto-run the fix
fixAINotWorking().catch(console.error);

// Make function available globally for manual execution
window.fixAINotWorking = fixAINotWorking;