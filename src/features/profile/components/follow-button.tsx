import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../core/auth/auth-context';
import type { Profile } from '../models/profile.model';
import { followProfile, unfollowProfile } from '../services/profile';

type FollowButtonProps = {
  profile: Profile;
  onToggle: (profile: Profile) => void;
};

export function FollowButton({ profile, onToggle }: FollowButtonProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function toggleFollowing(): Promise<void> {
    setIsSubmitting(true);

    if (!isAuthenticated) {
      void navigate('/login');
      return;
    }

    try {
      const nextProfile = !profile.following
        ? await followProfile(profile.username)
        : await unfollowProfile(profile.username);
      setIsSubmitting(false);
      onToggle(nextProfile);
    } catch {
      setIsSubmitting(false);
    }
  }

  const classes = [
    'btn',
    'btn-sm',
    'action-btn',
    isSubmitting ? 'disabled' : '',
    profile.following ? 'btn-secondary' : 'btn-outline-secondary',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} type="button" onClick={() => void toggleFollowing()}>
      <i className="ion-plus-round"></i>
      &nbsp;
      {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
    </button>
  );
}
