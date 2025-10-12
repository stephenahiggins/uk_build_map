import React from 'react';
import Callout from '../components/molecules/Callout';
import Banner from '../components/molecules/Banner';

/*
  Example usage of the Callout component
  
  This file demonstrates how to use the Callout molecule component
  in different scenarios including within banners and standalone.
*/

const CalloutExamples: React.FC = () => {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Callout Component Examples</h1>

      {/* Standalone Callouts */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Standalone Callouts</h2>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Callout icon="FiInfo" variant="info">
              Information callout
            </Callout>
            <Callout icon="FiAlertTriangle" variant="warning">
              Warning message
            </Callout>
            <Callout icon="FiCheckCircle" variant="success">
              Success notification
            </Callout>
            <Callout icon="FiXCircle" variant="destructive">
              Error alert
            </Callout>
          </div>

          <div className="flex flex-wrap gap-2">
            <Callout icon="FiStar" variant="default" size="sm">
              Small callout
            </Callout>
            <Callout icon="FiHeart" variant="secondary" size="md">
              Medium callout
            </Callout>
            <Callout icon="FiThumbsUp" variant="outline" size="lg">
              Large callout
            </Callout>
          </div>

          {/* Custom pixel size examples */}
          <div className="flex flex-wrap gap-2">
            <Callout icon="FiSettings" variant="info" fontSize={12} iconSize={16}>
              Custom 12px font, 16px icon
            </Callout>
            <Callout icon="FiMapPin" variant="success" fontSize={18} iconSize={24}>
              Custom 18px font, 24px icon
            </Callout>
            <Callout icon="FiZap" variant="warning" fontSize={14} iconSize={20}>
              Custom 14px font, 20px icon
            </Callout>
          </div>
        </div>
      </section>

      {/* Callouts in Banners */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Callouts in Banners</h2>
        <div className="space-y-4">
          <Banner
            bgClassName="bg-blue-50"
            textClassName="text-blue-900"
            borderClassName="border-blue-300"
          >
            <div className="flex items-center gap-3">
              <span>New feature available!</span>
              <Callout icon="FiZap" variant="info" size="sm">
                Beta
              </Callout>
            </div>
          </Banner>

          <Banner
            bgClassName="bg-green-50"
            textClassName="text-green-900"
            borderClassName="border-green-300"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>Project successfully deployed</span>
              <Callout icon="FiCheckCircle" variant="success" size="sm">
                Live
              </Callout>
            </div>
          </Banner>

          <Banner
            bgClassName="bg-yellow-50"
            textClassName="text-yellow-900"
            borderClassName="border-yellow-300"
          >
            <div className="flex items-center justify-between">
              <span>Maintenance scheduled for tonight</span>
              <Callout icon="FiClock" variant="warning" size="sm">
                2 hours
              </Callout>
            </div>
          </Banner>
        </div>
      </section>

      {/* Custom Icon Example */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Custom Icon Examples</h2>
        <div className="space-y-3">
          <Callout
            icon={<span className="text-red-500">🚀</span>}
            variant="outline"
          >
            Custom emoji icon
          </Callout>

          <Callout variant="secondary">No icon callout</Callout>
        </div>
      </section>
    </div>
  );
};

export default CalloutExamples;
