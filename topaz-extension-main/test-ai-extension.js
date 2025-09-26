// 🧪 AI EXTENSION TEST SCRIPT
// Run this in the browser console on YouTube to test if AI is working

console.log('🧪 TESTING AI EXTENSION FUNCTIONALITY...');

async function testAIExtension() {
    try {
        console.log('🔍 Step 1: Checking extension controller...');
        
        // Check if extension controller exists
        if (window.__topazController) {
            console.log('✅ Extension controller found');
            
            // Check if lifecycle manager exists
            if (window.__topazLifecycleManager) {
                console.log('✅ Lifecycle manager found');
                const status = window.__topazLifecycleManager.getStatus();
                console.log('📊 Lifecycle status:', status);
            } else {
                console.log('⚠️ Lifecycle manager not found (using old system)');
            }
            
            // Check if extension is enabled
            const isEnabled = !window.__topazController.isDisabled;
            console.log(`📊 Extension enabled: ${isEnabled}`);
            
            // Check profiles
            console.log('🔍 Step 2: Checking profiles...');
            const response = await chrome.runtime.sendMessage({
                type: 'GET_PROFILE_DATA'
            });
            
            if (response && response.profiles) {
                const enabledProfiles = response.profiles.filter(p => p.isEnabled);
                const youtubeProfiles = enabledProfiles.filter(p => 
                    p.allowedWebsites?.some(site => site.includes('youtube'))
                );
                
                console.log(`📊 Total profiles: ${response.profiles.length}`);
                console.log(`📊 Enabled profiles: ${enabledProfiles.length}`);
                console.log(`📊 YouTube profiles: ${youtubeProfiles.length}`);
                
                if (youtubeProfiles.length > 0) {
                    const blacklistTags = youtubeProfiles.flatMap(p => 
                        [...(p.blacklistTags || []), ...(p.customBlacklist || [])]
                    );
                    console.log(`📊 Blacklist tags: ${blacklistTags.length} tags`);
                    console.log(`📊 Tags: ${blacklistTags.join(', ')}`);
                }
            }
            
            // Test AI analysis
            console.log('🔍 Step 3: Testing AI analysis...');
            
            // Check if we're on YouTube
            const isYouTube = window.location.hostname.includes('youtube.com');
            if (isYouTube) {
                console.log('✅ On YouTube - testing AI analysis...');
                
                // Try to trigger analysis
                try {
                    await window.__topazController.performInitialExtraction(true);
                    console.log('✅ AI analysis triggered successfully!');
                    
                    // Wait a moment and check for AI activity
                    setTimeout(() => {
                        console.log('🔍 Checking for AI activity in console...');
                        console.log('💡 Look for messages like:');
                        console.log('   - "🧠 AI PRIMARY FEATURE"');
                        console.log('   - "✅ AI backend success"');
                        console.log('   - "🔍 [AI FIX] Added default blacklist tags"');
                    }, 2000);
                    
                } catch (error) {
                    console.log('⚠️ AI analysis trigger failed:', error.message);
                }
            } else {
                console.log('ℹ️ Not on YouTube - go to youtube.com to test AI');
            }
            
            console.log('');
            console.log('🎉 AI EXTENSION TEST COMPLETE!');
            console.log('📝 Summary:');
            console.log(`   - Extension controller: ${window.__topazController ? '✅ Found' : '❌ Missing'}`);
            console.log(`   - Lifecycle manager: ${window.__topazLifecycleManager ? '✅ Found' : '⚠️ Using old system'}`);
            console.log(`   - Extension enabled: ${isEnabled ? '✅ Yes' : '❌ No'}`);
            console.log(`   - Profiles configured: ${response?.profiles?.length > 0 ? '✅ Yes' : '❌ No'}`);
            console.log(`   - On YouTube: ${isYouTube ? '✅ Yes' : '❌ No'}`);
            console.log('');
            console.log('💡 If AI is not working:');
            console.log('   1. Make sure you\'re on youtube.com');
            console.log('   2. Check that profiles are enabled');
            console.log('   3. Look for AI activity in console');
            console.log('   4. Try refreshing the page');
            
        } else {
            console.log('❌ Extension controller not found');
            console.log('💡 Make sure the extension is loaded and active');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.log('💡 Try refreshing the page and running this test again');
    }
}

// Run the test
testAIExtension();

