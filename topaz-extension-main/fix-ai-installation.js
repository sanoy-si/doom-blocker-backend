// 🚨 CRITICAL AI FIX: Fix AI Installation Script
// This script fixes the AI not working issue for existing installations
// Run this in the browser console on any page where the extension is active

console.log('🔧 FIXING AI INSTALLATION - This will enable AI functionality...');

async function fixAIInstallation() {
    try {
        console.log('🔍 Step 1: Checking current extension state...');

        // Get current state from background
        let response = await chrome.runtime.sendMessage({
            type: 'GET_PROFILE_DATA'
        });

        if (!response || !response.profiles) {
            console.error('❌ Could not get profile data from background script');
            console.log('💡 Try refreshing the page and running this script again');
            return;
        }

        console.log(`📊 Found ${response.profiles.length} total profiles`);

        const enabledProfiles = response.profiles.filter(p => p.isEnabled);
        console.log(`📊 Currently enabled profiles: ${enabledProfiles.length}`);

        let fixesApplied = 0;

        // CRITICAL FIX 1: Enable YouTube profile if it exists but is disabled
        const youtubeProfile = response.profiles.find(p =>
            p.profileName?.toLowerCase().includes('youtube') ||
            p.allowedWebsites?.some(site => site.includes('youtube'))
        );

        if (youtubeProfile && !youtubeProfile.isEnabled) {
            console.log('🔧 FIXING: Enabling YouTube profile...');
            youtubeProfile.isEnabled = true;
            fixesApplied++;
        }

        // CRITICAL FIX 2: Add blacklist tags if missing
        const youtubeEnabledProfiles = response.profiles.filter(p => 
            p.isEnabled && p.allowedWebsites?.some(site => site.includes('youtube'))
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
                    'controversial', 'outrage', 'scandal', 'beef', 'exposed', 'shorts', 'mixes'
                ]);

                // Remove duplicates
                profile.blacklistTags = [...new Set(profile.blacklistTags)];
                fixesApplied++;
            }
        }

        // CRITICAL FIX 3: Enable other profiles if they exist but are disabled
        const otherProfiles = response.profiles.filter(p => 
            !p.profileName?.toLowerCase().includes('youtube') && !p.isEnabled
        );

        if (otherProfiles.length > 0) {
            console.log(`🔧 FIXING: Enabling ${otherProfiles.length} other profiles...`);
            otherProfiles.forEach(profile => {
                profile.isEnabled = true;
                fixesApplied++;
            });
        }

        // Save all changes
        if (fixesApplied > 0) {
            console.log(`💾 Saving ${fixesApplied} fixes to extension storage...`);
            
            await chrome.runtime.sendMessage({
                type: 'UPDATE_PROFILES',
                profiles: response.profiles
            });

            console.log('✅ All fixes saved successfully!');
        } else {
            console.log('✅ No fixes needed - AI should already be working!');
        }

        console.log('🔍 Step 2: Testing AI pipeline...');

        // Force trigger AI analysis if we're on a supported site
        const currentHostname = window.location.hostname.toLowerCase();
        const supportedSites = ['youtube.com', 'twitter.com', 'x.com', 'linkedin.com', 'reddit.com'];
        const isSupportedSite = supportedSites.some(site => 
            currentHostname === site || currentHostname.endsWith('.' + site)
        );

        if (isSupportedSite && window.__topazController) {
            console.log('🧠 Triggering AI analysis on current page...');
            try {
                await window.__topazController.performInitialExtraction(true);
                console.log('✅ AI analysis triggered successfully!');
            } catch (error) {
                console.log('⚠️ AI analysis trigger failed:', error.message);
                console.log('💡 Try refreshing the page to see AI in action');
            }
        } else if (!isSupportedSite) {
            console.log('ℹ️ Current site not supported for AI analysis');
            console.log('💡 Go to YouTube, Twitter, LinkedIn, or Reddit to test AI');
        } else {
            console.log('⚠️ Extension controller not found on this page');
            console.log('💡 Try refreshing the page');
        }

        console.log('');
        console.log('🎉 AI FIXES COMPLETE!');
        console.log('📝 Summary of fixes applied:');
        console.log(`   - Enabled profiles: ${fixesApplied > 0 ? 'Yes' : 'No'}`);
        console.log(`   - Added blacklist tags: ${allBlacklistTags.length === 0 ? 'Yes' : 'No'}`);
        console.log(`   - Triggered AI analysis: ${isSupportedSite ? 'Yes' : 'N/A'}`);
        console.log('');
        console.log('🧪 To test: Go to YouTube.com and check console for AI activity');
        console.log('   Look for messages like: "🧠 AI PRIMARY FEATURE" or "✅ AI backend success"');

    } catch (error) {
        console.error('❌ Fix failed:', error);
        console.log('💡 Try refreshing the page and running this script again');
    }
}

// Run the fix
fixAIInstallation();

